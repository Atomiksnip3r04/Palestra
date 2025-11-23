# 🔒 Risposta all'Incidente di Sicurezza - Chiave API Esposta

**Data**: 23 Novembre 2025
**Progetto**: IronFlow (ironflow-a9bc9)
**Tipo**: Esposizione pubblica chiave API Google Cloud

## ⚠️ Problema Identificato

La chiave API Firebase è stata esposta pubblicamente nel file `js/firebase-config.js` committato su Git.

**Chiave esposta**: `AIzaSyB2kwY2t8QqVDfKeC4gh_TuyX_vHNwVuwU`

## ✅ Azioni Immediate da Completare

### 1. Revoca Chiave API (URGENTE - Fai subito)
- [ ] Vai su https://console.cloud.google.com
- [ ] Seleziona progetto "ironflow-a9bc9"
- [ ] Naviga: **APIs & Services > Credentials**
- [ ] Trova e **elimina** la chiave `AIzaSyB2kwY2t8QqVDfKeC4gh_TuyX_vHNwVuwU`

### 2. Crea Nuova Chiave con Restrizioni
- [ ] Clicca **+ CREATE CREDENTIALS > API key**
- [ ] Configura restrizioni:
  - **Application restrictions**: HTTP referrers
  - Domini autorizzati:
    - `ironflow-a9bc9.firebaseapp.com/*`
    - `ironflow-a9bc9.web.app/*`
    - `localhost/*` (solo per sviluppo)
  - **API restrictions**: Limita alle API necessarie
    - Identity Toolkit API
    - Cloud Firestore API
    - Firebase Storage API
    - Token Service API

### 3. Aggiorna Configurazione Locale
- [ ] Copia la nuova chiave API
- [ ] Aggiorna `js/firebase-config.js` con la nuova chiave
- [ ] Verifica che `js/firebase-config.js` sia in `.gitignore`
- [ ] Testa l'applicazione per confermare il funzionamento

### 4. Pulizia Repository Git
```bash
# Rimuovi il file dalla history di Git (ATTENZIONE: operazione delicata)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch js/firebase-config.js" \
  --prune-empty --tag-name-filter cat -- --all

# Forza il push (se hai già pushato su remote)
git push origin --force --all
```

**NOTA**: Se il repository è pubblico o condiviso, considera di cambiare anche le altre credenziali.

### 5. Verifica Sicurezza Firebase

#### Firestore Rules
- [ ] Verifica che le regole di sicurezza siano restrittive
- [ ] Controlla `firestore.rules` per assicurarti che richiedano autenticazione

#### Firebase Authentication
- [ ] Verifica utenti non autorizzati in **Authentication > Users**
- [ ] Controlla accessi sospetti in **Authentication > Usage**

#### Monitoring
- [ ] Vai su **Cloud Console > Billing**
- [ ] Controlla addebiti anomali
- [ ] Imposta alert di budget se non già fatto

### 6. Configurazione Firestore Security Rules (Verifica)

Assicurati che le tue regole siano simili a:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Richiedi autenticazione per tutti i documenti
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Regole specifiche per utenti
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📋 Azioni Preventive Future

1. **Non committare mai credenziali**
   - Usa file `.example` per template
   - Mantieni credenziali in `.gitignore`

2. **Usa variabili d'ambiente**
   - Per progetti Node.js, usa `.env` files
   - Per frontend, considera Firebase Hosting config

3. **Abilita restrizioni API**
   - Sempre limitare per dominio/IP
   - Limitare alle API strettamente necessarie

4. **Monitoring continuo**
   - Configura alert di budget
   - Monitora usage dashboard regolarmente

5. **Rotazione chiavi periodica**
   - Cambia chiavi API ogni 3-6 mesi
   - Documenta il processo

## 🔍 Verifica Post-Incidente

Dopo aver completato le azioni:

- [ ] L'applicazione funziona con la nuova chiave
- [ ] `js/firebase-config.js` non è più tracciato da Git
- [ ] La vecchia chiave è stata revocata
- [ ] Non ci sono addebiti anomali
- [ ] Le regole Firestore sono sicure
- [ ] Non ci sono utenti sospetti in Authentication

## 📞 Risorse Utili

- [Google Cloud Console](https://console.cloud.google.com)
- [Firebase Console](https://console.firebase.google.com)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)

---

**Stato**: ⏳ In attesa di completamento azioni
**Priorità**: 🔴 CRITICA
