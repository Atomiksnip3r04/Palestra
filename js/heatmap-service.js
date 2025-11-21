import { EXERCISE_DB, MUSCLE_GROUPS } from './exercise-db.js';
import { MUSCLE_PATHS, SKELETON_PATH } from './muscle-model.js';

export class HeatmapService {
    constructor() {
        this.muscleFatigue = {}; // Stores muscle -> score (0-100)
    }

    /**
     * Calculates muscle fatigue based on logs from the last X days.
     * @param {Array} logs - The user's workout logs
     * @param {number} days - Lookback period (default 7)
     */
    calculateFatigue(logs, days = 7) {
        this.muscleFatigue = {};
        const now = new Date();
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - days);

        // Initialize all groups to 0
        Object.keys(MUSCLE_GROUPS).forEach(key => this.muscleFatigue[key] = 0);

        logs.forEach(log => {
            const logDate = new Date(log.date);
            if (logDate < cutoff) return;

            // Calculate decay factor (older workouts count less)
            const daysAgo = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));
            const recencyMultiplier = Math.max(0.2, 1 - (daysAgo * 0.1)); // 1.0 today, 0.3 a week ago

            if (log.exercises) {
                log.exercises.forEach(ex => {
                    const name = ex.name.toLowerCase();
                    // Find partial match in DB
                    const dbKey = Object.keys(EXERCISE_DB).find(k => name.includes(k));
                    
                    if (dbKey) {
                        const muscles = EXERCISE_DB[dbKey];
                        const setVolume = ex.sets.length; // Use set count as volume proxy
                        
                        muscles.forEach(muscle => {
                            if (!this.muscleFatigue[muscle]) this.muscleFatigue[muscle] = 0;
                            // Add fatigue: Sets * Recency
                            this.muscleFatigue[muscle] += (setVolume * 20 * recencyMultiplier);
                        });
                    }
                });
            }
        });

        // Cap at 100
        Object.keys(this.muscleFatigue).forEach(k => {
            this.muscleFatigue[k] = Math.min(100, this.muscleFatigue[k]);
        });

        return this.muscleFatigue;
    }

    /**
     * Generates the SVG HTML for the heatmap
     */
    renderSVG(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const getColor = (muscle) => {
            const fatigue = this.muscleFatigue[muscle] || 0;
            if (fatigue === 0) return "rgba(255,255,255,0.05)"; // Idle
            if (fatigue < 30) return "var(--color-primary-dim)"; // Low
            if (fatigue < 70) return "var(--color-primary)"; // Med
            return "#ff4444"; // High/Recovery needed
        };

        const getOpacity = (muscle) => {
             const fatigue = this.muscleFatigue[muscle] || 0;
             if (fatigue === 0) return 1; 
             return 0.6 + (fatigue/200); // Glow brighter with heat
        };

        // Render Front
        let frontPaths = '';
        Object.entries(MUSCLE_PATHS.front).forEach(([muscle, path]) => {
            frontPaths += `<path d="${path}" fill="${getColor(muscle)}" stroke="var(--color-border)" stroke-width="1" class="muscle-path" data-muscle="${muscle}" style="opacity: ${getOpacity(muscle)}"><title>${MUSCLE_GROUPS[muscle]?.label || muscle}</title></path>`;
        });

        // Render Back
        let backPaths = '';
        Object.entries(MUSCLE_PATHS.back).forEach(([muscle, path]) => {
            backPaths += `<path d="${path}" fill="${getColor(muscle)}" stroke="var(--color-border)" stroke-width="1" class="muscle-path" data-muscle="${muscle}" style="opacity: ${getOpacity(muscle)}"><title>${MUSCLE_GROUPS[muscle]?.label || muscle}</title></path>`;
        });

        const svg = `
        <div style="display: flex; justify-content: space-around; width: 100%; align-items: center; gap: 1rem;">
            <!-- Front View -->
            <div style="position: relative; width: 150px; height: 400px;">
                <h4 style="text-align:center; margin-bottom: 10px; color: var(--color-text-muted);">Front</h4>
                <svg viewBox="0 0 400 500" style="width: 100%; height: 100%; filter: drop-shadow(0 0 10px rgba(0,243,255,0.1));">
                    ${frontPaths}
                </svg>
            </div>

            <!-- Back View -->
            <div style="position: relative; width: 150px; height: 400px;">
                <h4 style="text-align:center; margin-bottom: 10px; color: var(--color-text-muted);">Back</h4>
                <svg viewBox="0 0 400 500" style="width: 100%; height: 100%; filter: drop-shadow(0 0 10px rgba(0,243,255,0.1));">
                    ${backPaths}
                </svg>
            </div>
        </div>
        <div style="text-align: center; margin-top: 1rem; display: flex; justify-content: center; gap: 1rem; font-size: 0.8rem; color: var(--color-text-muted);">
            <span style="display: flex; align-items: center; gap: 5px;"><div style="width: 10px; height: 10px; background: rgba(255,255,255,0.1)"></div> Riposo</span>
            <span style="display: flex; align-items: center; gap: 5px;"><div style="width: 10px; height: 10px; background: var(--color-primary)"></div> Attivo</span>
            <span style="display: flex; align-items: center; gap: 5px;"><div style="width: 10px; height: 10px; background: #ff4444"></div> Fatica Max</span>
        </div>
        `;

        container.innerHTML = svg;
    }
}

export const heatmapService = new HeatmapService();

