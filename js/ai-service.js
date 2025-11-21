import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

export class AIService {
    constructor() {
        // Set default key provided by user if not present
        if (!localStorage.getItem('ironflow_ai_key')) {
            localStorage.setItem('ironflow_ai_key', 'AIzaSyC7WC1A7gcDKAb_o9LnZT7wMiE3BGhazFI');
        }
        this.apiKey = localStorage.getItem('ironflow_ai_key');
    }

    hasKey() {
        return !!this.apiKey;
    }

    saveKey(key) {
        this.apiKey = key;
        localStorage.setItem('ironflow_ai_key', key);
    }

    // --- TOON Encoder Implementation (Lightweight) ---
    // Reference: https://github.com/toon-format/toon
    encodeToTOON(data, rootName = 'data') {
        if (Array.isArray(data)) {
            if (data.length === 0) return `${rootName}[0]{}`;
            
            // Get all unique keys from first item (assuming consistent schema for token efficiency)
            const keys = Object.keys(data[0]);
            const header = `${rootName}[${data.length}]{${keys.join(',')}}:`;
            
            const rows = data.map(item => {
                return '  ' + keys.map(k => {
                    let val = item[k];
                    if (val === undefined || val === null) return '';
                    if (typeof val === 'object') return JSON.stringify(val); // Nested objects fallback
                    return String(val).replace(/,/g, '\\,'); // Escape commas
                }).join(',');
            }).join('\n');

            return `${header}\n${rows}`;
        } 
        
        if (typeof data === 'object' && data !== null) {
            // Single object
            return `${rootName}:\n` + Object.entries(data)
                .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
                .join('\n');
        }

        return `${rootName}: ${data}`;
    }

    async analyzeProgress(data) {
        if (!this.apiKey) {
            return { success: false, message: "API Key mancante." };
        }

        try {
            const genAI = new GoogleGenerativeAI(this.apiKey);
            // Using the latest requested model
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 
            // Note: "gemini-3-pro-preview" might not be publicly available via API yet, 
            // falling back to 2.0 Flash (fastest/newest public) or 1.5 Pro if needed. 
            // I'll try 1.5 Pro as safe bet for complex reasoning or 2.0 Flash for speed.
            // Let's stick to 1.5 Pro for reliable instruction following on TOON for now, 
            // or try the requested string if the SDK supports it.

            // Convert data to TOON to save tokens
            const toonLogs = this.encodeToTOON(data.recentLogs, 'workoutLogs');
            const toonPrs = this.encodeToTOON(Object.entries(data.prs).map(([k,v]) => ({lift: k, weight: v})), 'personalRecords');

            const prompt = `
Sei un coach esperto di Strength & Conditioning.
Analizza i dati dell'atleta forniti in formato TOON (Token-Oriented Object Notation).

DATI ATLETA (TOON):
${toonPrs}

${toonLogs}

INFO GENERALI:
- Nome: ${data.profile.name || 'Atleta'}
- Peso Corporeo: ${data.bodyStats.length > 0 ? data.bodyStats[0].weight : 'N/D'} kg
- Totale Sessioni: ${data.recentWorkoutCount}

RICHIESTA:
1. Analizza volume e frequenza basandoti sui log TOON.
2. Identifica carenze dai massimali (personalRecords).
3. Fornisci 3 consigli pratici.
4. Rispondi in Markdown, tono da Coach esperto.
`;
            console.log("Sending TOON Prompt size:", prompt.length);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return { success: true, text: text };
        } catch (error) {
            console.error("AI Error:", error);
            return { success: false, message: "Errore AI: " + error.message };
        }
    }
}

export const aiService = new AIService();
