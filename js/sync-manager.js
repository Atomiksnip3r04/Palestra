/**
 * Sync Manager - Gestione centralizzata della sincronizzazione cloud
 * 
 * Questo modulo viene caricato su tutte le pagine per garantire:
 * 1. Sincronizzazione automatica quando l'utente è autenticato
 * 2. Caricamento dati dal cloud all'avvio
 * 3. Auto-sync periodico ogni 5 minuti
 * 4. Sync quando la pagina torna in focus
 */

import { authService } from './auth-service.js';
import { firestoreService } from './firestore-service.js';

class SyncManager {
    constructor() {
        this.initialized = false;
        this.autoSyncInterval = null;
        this.lastSyncTime = null;
        this.AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minuti
        this.MIN_SYNC_INTERVAL = 30 * 1000; // Minimo 30 secondi tra sync
        this.onSyncCallbacks = [];
    }

    /**
     * Inizializza il sync manager - chiamare una volta per pagina
     */
    init() {
        if (this.initialized) {
            console.log('🔄 [SyncManager] Già inizializzato');
            return;
        }

        this.initialized = true;
        console.log('🔄 [SyncManager] Inizializzazione...');

        // Ascolta i cambiamenti di autenticazione
        authService.subscribe(async (user) => {
            if (user) {
                console.log('🔐 [SyncManager] Utente autenticato:', user.email);
                await this.onUserAuthenticated();
            } else {
                console.log('🔓 [SyncManager] Utente disconnesso');
                this.stopAutoSync();
            }
        });

        // Fallback: se l'utente è già autenticato
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            console.log('🔐 [SyncManager] Utente già autenticato:', currentUser.email);
            this.onUserAuthenticated();
        }

        // Sync quando la pagina torna in focus
        this.setupVisibilityListener();

        // Sync prima di chiudere la pagina
        this.setupBeforeUnloadListener();
    }

    /**
     * Chiamato quando l'utente viene autenticato
     */
    async onUserAuthenticated() {
        // Carica dati dal cloud
        await this.loadFromCloud();

        // Avvia auto-sync dopo 3 secondi
        setTimeout(() => this.syncToCloud(), 3000);

        // Avvia sync periodico
        this.startAutoSync();
    }

    /**
     * Carica e merge i dati dal cloud
     */
    async loadFromCloud() {
        try {
            const user = authService.getCurrentUser();
            if (!user) {
                console.log('⏳ [SyncManager] Skip load - utente non autenticato');
                return { success: false };
            }

            console.log('☁️ [SyncManager] Caricamento dati dal cloud...');
            const result = await firestoreService.loadFromCloud();
            
            if (result.success) {
                console.log('✅ [SyncManager] Dati cloud caricati');
                this.notifyListeners('load', result);
                
                // Dopo il load, fai sempre una sync per assicurarti che i dati locali siano nel cloud
                // Questo è importante per evitare perdita di dati
                console.log('🔄 [SyncManager] Sync post-load per sicurezza...');
                await this.syncToCloud(true);
            }
            
            return result;
        } catch (error) {
            console.warn('⚠️ [SyncManager] Caricamento cloud fallito:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sincronizza i dati locali nel cloud
     */
    async syncToCloud(force = false) {
        try {
            const user = authService.getCurrentUser();
            if (!user) {
                console.warn('⚠️ [SyncManager] Skip sync - utente non autenticato (user:', user, ')');
                // Prova ad aspettare l'autenticazione
                const waitedUser = await authService.waitForAuth();
                if (!waitedUser) {
                    console.warn('⚠️ [SyncManager] Sync annullata - nessun utente dopo attesa');
                    return { success: false, reason: 'not_authenticated' };
                }
                console.log('🔐 [SyncManager] Utente trovato dopo attesa:', waitedUser.email);
            }

            // Evita sync troppo frequenti (a meno che non sia forzato)
            if (!force && this.lastSyncTime) {
                const timeSinceLastSync = Date.now() - this.lastSyncTime;
                if (timeSinceLastSync < this.MIN_SYNC_INTERVAL) {
                    console.log('⏳ [SyncManager] Skip sync - troppo recente');
                    return { success: true, skipped: true };
                }
            }

            console.log('🔄 [SyncManager] Sincronizzazione in corso...');
            const result = await firestoreService.syncToCloud();
            
            if (result.success) {
                this.lastSyncTime = Date.now();
                console.log('✅ [SyncManager] Sync completata:', new Date().toLocaleTimeString());
                this.notifyListeners('sync', result);
            } else {
                console.warn('⚠️ [SyncManager] Sync fallita:', result.message);
            }
            
            return result;
        } catch (error) {
            console.error('❌ [SyncManager] Errore sync:', error.message, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Avvia la sincronizzazione automatica periodica
     */
    startAutoSync() {
        if (this.autoSyncInterval) {
            return; // Già attivo
        }

        this.autoSyncInterval = setInterval(async () => {
            await this.syncToCloud();
        }, this.AUTO_SYNC_INTERVAL);

        console.log('🔄 [SyncManager] Auto-sync attivato: ogni 5 minuti');
    }

    /**
     * Ferma la sincronizzazione automatica
     */
    stopAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
            console.log('🔄 [SyncManager] Auto-sync disattivato');
        }
    }

    /**
     * Listener per quando la pagina torna visibile
     */
    setupVisibilityListener() {
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden) {
                const user = authService.getCurrentUser();
                if (user) {
                    console.log('👁️ [SyncManager] Pagina tornata in focus, sync...');
                    // Prima carica dal cloud per avere gli ultimi dati
                    await this.loadFromCloud();
                    this.notifyListeners('focus', {});
                }
            }
        });

        // Anche su window focus (per PWA e mobile)
        window.addEventListener('focus', async () => {
            const user = authService.getCurrentUser();
            if (user) {
                // Evita doppia sync se visibilitychange già gestito
                const timeSinceLastSync = this.lastSyncTime ? Date.now() - this.lastSyncTime : Infinity;
                if (timeSinceLastSync > this.MIN_SYNC_INTERVAL) {
                    console.log('👁️ [SyncManager] Window focus, caricamento cloud...');
                    await this.loadFromCloud();
                    this.notifyListeners('focus', {});
                }
            }
        });
    }

    /**
     * Sync prima di chiudere la pagina
     */
    setupBeforeUnloadListener() {
        window.addEventListener('beforeunload', () => {
            const user = authService.getCurrentUser();
            if (user) {
                // Usa sendBeacon per sync asincrona che non blocca la chiusura
                // Nota: sendBeacon non funziona con Firestore, quindi facciamo sync sincrona
                // In futuro si potrebbe usare un service worker
                console.log('👋 [SyncManager] Pagina in chiusura...');
            }
        });

        // Per mobile/PWA: sync quando l'app va in background
        document.addEventListener('pause', async () => {
            const user = authService.getCurrentUser();
            if (user) {
                console.log('📱 [SyncManager] App in pausa, sync...');
                await this.syncToCloud(true);
            }
        });
    }

    /**
     * Registra un callback per eventi di sync
     * @param {Function} callback - Funzione chiamata con (eventType, data)
     */
    onSync(callback) {
        this.onSyncCallbacks.push(callback);
    }

    /**
     * Notifica i listener registrati
     */
    notifyListeners(eventType, data) {
        this.onSyncCallbacks.forEach(cb => {
            try {
                cb(eventType, data);
            } catch (e) {
                console.warn('[SyncManager] Callback error:', e);
            }
        });
    }

    /**
     * Verifica se l'utente è autenticato
     */
    isAuthenticated() {
        return !!authService.getCurrentUser();
    }

    /**
     * Ottieni l'utente corrente
     */
    getCurrentUser() {
        return authService.getCurrentUser();
    }
}

// Singleton instance
export const syncManager = new SyncManager();

// Auto-init quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => syncManager.init());
} else {
    // DOM già caricato
    syncManager.init();
}
