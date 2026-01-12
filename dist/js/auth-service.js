import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from './firebase-config.js';
import { firestoreService } from './firestore-service.js';

export class AuthService {
    constructor() {
        this.user = undefined;
        this.onUserChangeCallbacks = [];
        this._authReady = false;

        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            console.log('🔐 [AuthService] Auth state changed:', user?.email || 'null');
            this.user = user;
            this._authReady = true;
            this.notifyListeners(user);
        });
        
        // Log initial state
        console.log('🔐 [AuthService] Inizializzato, auth.currentUser:', auth.currentUser?.email || 'null');
    }

    async register(email, password, name) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile name immediately
            if (name) {
                await updateProfile(user, { displayName: name });
            }

            // Initialize user data in Firestore (including default API key)
            await firestoreService.initializeNewUser(user);

            return { success: true, user };
        } catch (error) {
            console.error("Registration error:", error);
            return { success: false, message: error.message };
        }
    }

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: error.message };
        }
    }

    async logout() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    subscribe(callback) {
        this.onUserChangeCallbacks.push(callback);
        // Se l'auth è già pronto, chiama subito il callback
        if (this._authReady) {
            callback(this.user);
        }
    }

    notifyListeners(user) {
        this.onUserChangeCallbacks.forEach(cb => cb(user));
    }

    getCurrentUser() {
        // Usa this.user che viene aggiornato da onAuthStateChanged
        // invece di auth.currentUser che potrebbe non essere ancora pronto
        const user = this.user !== undefined ? this.user : auth.currentUser;
        console.log('🔐 [AuthService] getCurrentUser:', user?.email || 'null', '(this.user:', this.user?.email || 'undefined', ', auth.currentUser:', auth.currentUser?.email || 'null', ')');
        return user;
    }

    /**
     * Attende che l'autenticazione sia pronta
     * @param {number} timeout - Timeout in ms (default 10s)
     * @returns {Promise<User|null>}
     */
    waitForAuth(timeout = 10000) {
        return new Promise((resolve) => {
            // Se l'auth è già pronto, risolvi subito
            if (this._authReady) {
                console.log('🔐 [AuthService] waitForAuth: già pronto, user:', this.user?.email || 'null');
                resolve(this.user);
                return;
            }
            
            console.log('🔐 [AuthService] waitForAuth: attendo auth state...');
            
            // Timeout per evitare attese infinite
            const timeoutId = setTimeout(() => {
                console.warn('🔐 [AuthService] waitForAuth: timeout raggiunto');
                resolve(this.user || auth.currentUser || null);
            }, timeout);
            
            // Aspetta il primo callback
            const unsubscribe = (user) => {
                clearTimeout(timeoutId);
                // Rimuovi questo callback
                const index = this.onUserChangeCallbacks.indexOf(unsubscribe);
                if (index > -1) {
                    this.onUserChangeCallbacks.splice(index, 1);
                }
                console.log('🔐 [AuthService] waitForAuth: risolto con user:', user?.email || 'null');
                resolve(user);
            };
            
            this.onUserChangeCallbacks.push(unsubscribe);
        });
    }
    
    /**
     * Verifica se l'auth è pronto
     */
    isReady() {
        return this._authReady;
    }
}

// Singleton instance
export const authService = new AuthService();

