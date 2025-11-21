import { db, doc, setDoc, getDoc, updateDoc, arrayUnion } from './firebase-config.js'; // Added arrayUnion
import { auth } from './firebase-config.js';

export class FirestoreService {
    constructor() {
        this.collectionName = 'users';
    }

    // Get current user ID or throw error
    getUid() {
        const user = auth.currentUser;
        if (!user) throw new Error("Utente non autenticato");
        return user.uid;
    }

    // Helper: Convert File to Base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Helper: Resize Image (to avoid hitting Firestore 1MB limit)
    resizeImage(base64Str, maxWidth = 300) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG 70%
            };
        });
    }

    // Save all local data to Firestore (workouts, logs, profile settings)
    async syncToCloud() {
        try {
            const uid = this.getUid();
            
            // Gather data from LocalStorage
            const localWorkouts = JSON.parse(localStorage.getItem('ironflow_workouts') || '[]');
            const localLogs = JSON.parse(localStorage.getItem('ironflow_logs') || '[]');
            const localProfile = JSON.parse(localStorage.getItem('ironflow_profile') || '{}');
            const localBodyStats = JSON.parse(localStorage.getItem('ironflow_body_stats') || '[]');
            
            const data = {
                workouts: localWorkouts,
                logs: localLogs,
                profile: localProfile,
                bodyStats: localBodyStats,
                lastUpdated: new Date().toISOString()
            };

            await setDoc(doc(db, this.collectionName, uid), data, { merge: true });
            console.log("Data synced to Firestore successfully");
            return { success: true };
        } catch (error) {
            console.error("Error syncing to Firestore:", error);
            return { success: false, message: error.message };
        }
    }

    // Load data from Firestore and update LocalStorage
    async loadFromCloud() {
        try {
            const uid = this.getUid();
            const docRef = doc(db, this.collectionName, uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Update LocalStorage
                if (data.workouts) localStorage.setItem('ironflow_workouts', JSON.stringify(data.workouts));
                if (data.logs) localStorage.setItem('ironflow_logs', JSON.stringify(data.logs));
                if (data.profile) localStorage.setItem('ironflow_profile', JSON.stringify(data.profile));
                if (data.bodyStats) localStorage.setItem('ironflow_body_stats', JSON.stringify(data.bodyStats));
                
                console.log("Data loaded from Firestore");
                return { success: true, data };
            } else {
                console.log("No document found for this user (first login?)");
                return { success: true, data: null, isNew: true };
            }
        } catch (error) {
            console.error("Error loading from Firestore:", error);
            return { success: false, message: error.message };
        }
    }

    // Upload profile picture (Base64 to Firestore)
    async uploadProfilePhoto(file) {
        try {
            const uid = this.getUid();
            
            // 1. Convert to Base64
            let base64 = await this.fileToBase64(file);
            
            // 2. Resize/Compress to ensure it fits in Firestore doc (max 1MB total doc size)
            base64 = await this.resizeImage(base64, 300); // Resize to 300px width

            // 3. Update Firestore
            await updateDoc(doc(db, this.collectionName, uid), {
                "profile.photoUrl": base64
            });

            // 4. Update LocalStorage
            const localProfile = JSON.parse(localStorage.getItem('ironflow_profile') || '{}');
            localProfile.photoUrl = base64;
            localStorage.setItem('ironflow_profile', JSON.stringify(localProfile));

            return { success: true, url: base64 };
        } catch (error) {
            console.error("Error uploading photo:", error);
            return { success: false, message: error.message };
        }
    }

    // Save single profile field (e.g. name)
    async updateProfileField(field, value) {
        try {
            const uid = this.getUid();
            
            // Update Firestore
            await setDoc(doc(db, this.collectionName, uid), {
                profile: { [field]: value }
            }, { merge: true });

            // Update LocalStorage
            const localProfile = JSON.parse(localStorage.getItem('ironflow_profile') || '{}');
            localProfile[field] = value;
            localStorage.setItem('ironflow_profile', JSON.stringify(localProfile));
            
            return { success: true };
        } catch (error) {
            console.error("Error updating profile:", error);
            return { success: false, message: error.message };
        }
    }

    // Helper: Gather data for AI Analysis
    async gatherDataForAI() {
        try {
            // Fetch fresh data if possible, otherwise use local
            const localLogs = JSON.parse(localStorage.getItem('ironflow_logs') || '[]');
            const localBodyStats = JSON.parse(localStorage.getItem('ironflow_body_stats') || '[]');
            const localProfile = JSON.parse(localStorage.getItem('ironflow_profile') || '{}');

            // Filter last 30 days logs
            const now = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);

            const recentLogs = localLogs.filter(log => new Date(log.date) >= thirtyDaysAgo);

            // Calculate PRs locally to save tokens
            const prs = {};
            localLogs.forEach(log => {
                if (!log.exercises) return;
                log.exercises.forEach(ex => {
                    const name = ex.name.toLowerCase();
                    ex.sets.forEach(set => {
                        const w = parseFloat(set.weight);
                        const r = parseFloat(set.reps);
                        if (w > 0 && r > 0) {
                            const oneRM = w * (1 + r / 30);
                            if (!prs[name] || oneRM > prs[name]) {
                                prs[name] = Math.round(oneRM);
                            }
                        }
                    });
                });
            });

            // Sort PRs to keep only top 5-10 relevant ones
            const topPrs = Object.entries(prs)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

            // Simplify Logs for Token Efficiency (Date + Volume + Main Lift if any)
            const simplifiedLogs = recentLogs.map(log => {
                const mainLifts = log.exercises.slice(0, 3).map(e => `${e.name} (${e.sets.length} sets)`);
                return {
                    date: log.date.split('T')[0],
                    volume: log.totalVolume,
                    mainExercises: mainLifts
                };
            });

            return {
                profile: localProfile,
                bodyStats: localBodyStats.slice(0, 3), // Last 3 weigh-ins
                recentLogs: simplifiedLogs,
                recentWorkoutCount: recentLogs.length,
                prs: topPrs
            };

        } catch (e) {
            console.error("Error gathering data:", e);
            return null;
        }
    }

    // Save AI Analysis to Firestore History
    async saveAIAnalysis(text) {
        try {
            const uid = this.getUid();
            const analysisEntry = {
                date: new Date().toISOString(),
                text: text,
                summary: text.substring(0, 100) + '...' // Preview
            };

            // Use arrayUnion to add to an array "aiHistory" in the user doc
            await updateDoc(doc(db, this.collectionName, uid), {
                aiHistory: arrayUnion(analysisEntry)
            });
            
            return { success: true };
        } catch (error) {
            console.error("Error saving AI analysis:", error);
            return { success: false, message: error.message };
        }
    }

    // Load AI History
    async getAIHistory() {
        try {
            const uid = this.getUid();
            const docSnap = await getDoc(doc(db, this.collectionName, uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                return data.aiHistory || []; // Return empty array if no history
            }
            return [];
        } catch (error) {
            console.error("Error loading history:", error);
            return [];
        }
    }
}

export const firestoreService = new FirestoreService();
