# Report Analisi UI/UX - Pagina "Crea Scheda"

## 1. Analisi Generale & Layout
L'interfaccia presenta un design moderno (Dark Mode) coerente con il brand, ma soffre di problemi di spaziatura verticale e gerarchia visiva che compromettono l'usabilità, specialmente su dispositivi mobili.

### Header e Titoli
*   **Problema:** Il titolo "CREA NUOVA SCHEDA" e la sezione "AI WORKOUT GENERATOR" occupano una porzione significativa dello schermo (above the fold), spingendo il contenuto principale (gli esercizi) troppo in basso.
*   **Impatto:** L'utente deve scorrere immediatamente per iniziare a lavorare.

### Spaziatura Verticale (Vertical Rhythm)
*   **Problema:** La densità degli elementi varia in modo incoerente. Alcune sezioni sono molto ariose (Header), altre estremamente dense (Lista dei set).

## 2. Card Esercizio - Struttura e Allineamento
La card dell'esercizio è il cuore della pagina e presenta diverse criticità di layout visibili negli screenshot.

### Header dell'Esercizio
*   **Allineamento Note/Recupero:** C'è un evidente disallineamento visivo tra l'area di testo "Note opzionali" e l'input "Recupero".
    *   L'input del recupero sembra "fluttuare" o non avere la stessa altezza/line-height della textarea.
    *   Il box del recupero è visivamente pesante rispetto al campo note.
*   **Gerarchia:** Non è immediatamente chiaro che il campo "Recupero (s)" in alto è il valore globale per l'esercizio, mentre quelli nelle righe dei set sono override specifici.

### Gestione dei Set (Serie)
*   **Etichette Colonne Mancanti:** Le righe dei set (#1, #2, #3) presentano campi di input (Reps, RPE, Rest) senza etichette di colonna esplicite sopra di essi.
    *   L'utente si affida ai placeholder intuiibili, ma una volta inserito un numero, il contesto ("è RPE o Reps?") si perde se non si conosce a memoria l'ordine.
*   **Pulsanti "Quick Add":** I pulsanti ("3x Normali", "+ Warm-up", ecc.) sono visivamente disordinati e occupano molto spazio verticale. La spaziatura tra di essi sembra minima.
*   **Select "Tipo Set":** Il menu a tendina "Normale" occupa molto spazio orizzontale, rubando spazio ai campi numerici che sono l'input principale.
*   **Pulsante Eliminazione:** La "X" rossa è piccola e posizionata molto vicino all'ultimo input, aumentando il rischio di tocchi accidentali ("Fat finger error").

## 3. Usabilità Mobile (Touch Targets)
*   **Dimensioni Input:** I campi per Reps, RPE e Rest appaiono visivamente piccoli negli screenshot. Su mobile, target inferiori a 44x44px sono difficili da toccare con precisione.
*   **Safe Area Inferiore:**
    *   Nell'ultimo screenshot, i pulsanti "SALVA SCHEDA" e "ANNULLA" sono pericolosamente vicini al bordo inferiore dello schermo e alla barra di navigazione di sistema (Android gesture bar).
    *   Manca un padding inferiore sufficiente per evitare sovrapposizioni o tocchi errati (chiudere l'app invece di annullare).

## 4. Coerenza Visiva (Consistency)
*   **Input Styling:** C'è una leggera incongruenza tra gli input "border-box" (come il nome scheda) e i selettori/input interni alle card.
*   **Contrasto Placeholder:** I placeholder ("es. Push Day A") hanno un contrasto basso, che potrebbe ridurne la leggibilità in condizioni di forte luce ambientale, nonostante il tema scuro.

## 5. Sintesi delle Priorità
1.  **FIX CRITICO:** Aumentare il padding inferiore (bottom-padding) per distanziare i pulsanti d'azione dalla barra di sistema.
2.  **FIX UX:** Aggiungere etichette di colonna (Reps, RPE, Rest) fisse sopra la lista dei set o migliorare la distinzione visiva degli input.
3.  **FIX UI:** Allineare verticalmente e ridimensionare il blocco "Note" e "Recupero" per creare una riga visivamente coesa.
4.  **OTTIMIZZAZIONE:** Ridurre l'ingombro visivo dell'header e dei pulsanti "Quick Add" per mostrare più contenuto utile senza scroll.
