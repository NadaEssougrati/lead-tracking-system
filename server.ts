/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from "path";
import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import app from "./src/app.js";
import prisma from "./src/lib/prisma.js";

// Load environment variables
dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

// Initialize Gemini SDK with named parameter and user-agent for telemetry
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini API Client:", error);
  }
} else {
  console.log("Gemini API key is not configured. Real-time AI will use premium local heuristics.");
}

// REST API for lead analysis (Registered on the main Express app instance)
app.post("/api/gemini/analyze-lead", async (req, res) => {
  const { lead, activities } = req.body;

  if (!lead) {
    return res.status(400).json({ error: "Lead information is required" });
  }

  // If Gemini API is not configured or fails, we fall back to high-fidelity, simulated heuristics
  const fallbackScore = Math.min(100, Math.max(10, Math.round(
    (lead.priorite === "Haute" ? 35 : lead.priorite === "Moyenne" ? 20 : 10) +
    (lead.valeurEstimee > 100005 ? 25 : lead.valeurEstimee > 40005 ? 15 : 5) +
    (lead.source === "Recommandation" ? 20 : lead.source === "Salon professionnel" ? 15 : 5) +
    (activities && activities.length > 2 ? 15 : 5) +
    (lead.notes && lead.notes.length > 50 ? 5 : 0)
  )));

  const defaultAnalysis = {
    score: fallbackScore,
    actionRecommandee: "Planifier une démonstration technique détaillée et confirmer l'implication des décideurs.",
    meilleurMoment: "Mardi matin entre 9h30 et 11h00",
    opportunites: [
      `Budget estimé important (${lead.valeurEstimee.toLocaleString('fr-FR')} €) avec un besoin clairement identifié.`,
      `Source de type '${lead.source}' qui offre généralement un taux de conversion supérieur de 12%.`
    ],
    risques: [
      activities && activities.length === 0 ? "Aucune interaction récente enregistrée. Risque d'inactivité." : "S'assurer de l'adéquation technique pour éviter les décalages de planning.",
      lead.notes && lead.notes.toLowerCase().includes("concurrent") ? "Concurrence active signalée dans les notes." : "Délai de décision qui peut s'allonger en l'absence d'un champion interne."
    ],
    resumeEchanges: activities && activities.length > 0
      ? `Historique contenant ${activities.length} interaction(s). Le prospect montre un intérêt marqué notamment lors des échanges initiés par l'équipe.`
      : "Aucun échange significatif n'a été enregistré à ce jour pour ce prospect. Il est urgent d'établir le premier contact."
  };

  if (!ai) {
    return res.json({
      ...defaultAnalysis,
      isFallback: true,
      message: "Analyse générée par le moteur prédictif heuristique local (Configurez votre clé d'API Gemini dans les secrets pour activer l'IA en temps réel)."
    });
  }

  try {
    const prompt = `Vous êtes un assistant de vente intelligent et expert CRM de "Tracking Lead System".
Analysez les données du prospect (Lead) et ses dernières activités pour générer une fiche d'évaluation et de recommandation commerciale.

Fiche du prospect :
- Société : ${lead.societe}
- Secteur/Ville : ${lead.ville}, ${lead.pays}
- Statut : ${lead.statut}
- Priorité commerciale : ${lead.priorite}
- Budget estimé : ${lead.valeurEstimee} EUR
- Source d'acquisition : ${lead.source}
- Notes internes : ${lead.notes}

Activités récentes enregistrées :
${JSON.stringify(activities || [], null, 2)}

Fournissez les éléments suivants sous forme de JSON structuré en respectant scrupuleusement ce schéma :
{
  "score": <nombre entre 10 et 99 calculant la probabilité de conversion en pourcentage>,
  "actionRecommandee": "<une phrase décrivant la meilleure action immédiate et concrète à réaliser>",
  "meilleurMoment": "<le meilleur jour et créneau horaire de la semaine pour relancer le prospect>",
  "opportunites": [
    "<opportunité ou point positif 1>",
    "<opportunité ou point positif 2>"
  ],
  "risques": [
    "<facteur de risque ou signal d'alarme 1>",
    "<facteur de risque ou signal d'alarme 2>"
  ],
  "resumeEchanges": "<un résumé succinct et percutant de l'historique des échanges sous forme de court paragraphe en français>"
}

Répondez exclusivement avec le format JSON sans formater de code markdown comme \`\`\`json.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            actionRecommandee: { type: Type.STRING },
            meilleurMoment: { type: Type.STRING },
            opportunites: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            risques: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            resumeEchanges: { type: Type.STRING }
          },
          required: ["score", "actionRecommandee", "meilleurMoment", "opportunites", "risques", "resumeEchanges"]
        }
      }
    });

    const text = response.text || "";
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanText);

    return res.json({
      ...result,
      isFallback: false
    });
  } catch (error) {
    console.error("Gemini API error during lead analysis:", error);
    return res.json({
      ...defaultAnalysis,
      isFallback: true,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Serve API check (Registered on the main Express app instance)
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", isGeminiActive: !!ai });
});

// Setup Vite Dev Server / Static files
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const serverInstance = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });

  async function shutdown() {
    console.log("Shutting down database client...");
    await prisma.$disconnect();
    serverInstance.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});
