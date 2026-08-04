var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var ai = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
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
app.post("/api/gemini/analyze-lead", async (req, res) => {
  const { lead, activities } = req.body;
  if (!lead) {
    return res.status(400).json({ error: "Lead information is required" });
  }
  const fallbackScore = Math.min(100, Math.max(10, Math.round(
    (lead.priorite === "Haute" ? 35 : lead.priorite === "Moyenne" ? 20 : 10) + (lead.valeurEstimee > 1e5 ? 25 : lead.valeurEstimee > 4e4 ? 15 : 5) + (lead.source === "Recommandation" ? 20 : lead.source === "Salon professionnel" ? 15 : 5) + (activities && activities.length > 2 ? 15 : 5) + (lead.notes && lead.notes.length > 50 ? 5 : 0)
  )));
  const defaultAnalysis = {
    score: fallbackScore,
    actionRecommandee: "Planifier une d\xE9monstration technique d\xE9taill\xE9e et confirmer l'implication des d\xE9cideurs.",
    meilleurMoment: "Mardi matin entre 9h30 et 11h00",
    opportunites: [
      `Budget estim\xE9 important (${lead.valeurEstimee.toLocaleString("fr-FR")} \u20AC) avec un besoin clairement identifi\xE9.`,
      `Source de type '${lead.source}' qui offre g\xE9n\xE9ralement un taux de conversion sup\xE9rieur de 12%.`
    ],
    risques: [
      activities && activities.length === 0 ? "Aucune interaction r\xE9cente enregistr\xE9e. Risque d'inactivit\xE9." : "S'assurer de l'ad\xE9quation technique pour \xE9viter les d\xE9calages de planning.",
      lead.notes && lead.notes.toLowerCase().includes("concurrent") ? "Concurrence active signal\xE9e dans les notes." : "D\xE9lai de d\xE9cision qui peut s'allonger en l'absence d'un champion interne."
    ],
    resumeEchanges: activities && activities.length > 0 ? `Historique contenant ${activities.length} interaction(s). Le prospect montre un int\xE9r\xEAt marqu\xE9 notamment lors des \xE9changes initi\xE9s par l'\xE9quipe.` : "Aucun \xE9change significatif n'a \xE9t\xE9 enregistr\xE9 \xE0 ce jour pour ce prospect. Il est urgent d'\xE9tablir le premier contact."
  };
  if (!ai) {
    return res.json({
      ...defaultAnalysis,
      isFallback: true,
      message: "Analyse g\xE9n\xE9r\xE9e par le moteur pr\xE9dictif heuristique local (Configurez votre cl\xE9 d'API Gemini dans les secrets pour activer l'IA en temps r\xE9el)."
    });
  }
  try {
    const prompt = `Vous \xEAtes un assistant de vente intelligent et expert CRM de "Tracking Lead System".
Analysez les donn\xE9es du prospect (Lead) et ses derni\xE8res activit\xE9s pour g\xE9n\xE9rer une fiche d'\xE9valuation et de recommandation commerciale.

Fiche du prospect :
- Soci\xE9t\xE9 : ${lead.societe}
- Secteur/Ville : ${lead.ville}, ${lead.pays}
- Statut : ${lead.statut}
- Priorit\xE9 commerciale : ${lead.priorite}
- Budget estim\xE9 : ${lead.valeurEstimee} EUR
- Source d'acquisition : ${lead.source}
- Notes internes : ${lead.notes}

Activit\xE9s r\xE9centes enregistr\xE9es :
${JSON.stringify(activities || [], null, 2)}

Fournissez les \xE9l\xE9ments suivants sous forme de JSON structur\xE9 en respectant scrupuleusement ce sch\xE9ma :
{
  "score": <nombre entre 10 et 99 calculant la probabilit\xE9 de conversion en pourcentage>,
  "actionRecommandee": "<une phrase d\xE9crivant la meilleure action imm\xE9diate et concr\xE8te \xE0 r\xE9aliser>",
  "meilleurMoment": "<le meilleur jour et cr\xE9neau horaire de la semaine pour relancer le prospect>",
  "opportunites": [
    "<opportunit\xE9 ou point positif 1>",
    "<opportunit\xE9 ou point positif 2>"
  ],
  "risques": [
    "<facteur de risque ou signal d'alarme 1>",
    "<facteur de risque ou signal d'alarme 2>"
  ],
  "resumeEchanges": "<un r\xE9sum\xE9 succinct et percutant de l'historique des \xE9changes sous forme de court paragraphe en fran\xE7ais>"
}

R\xE9pondez exclusivement avec le format JSON sans formater de code markdown comme \`\`\`json.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            score: { type: import_genai.Type.INTEGER },
            actionRecommandee: { type: import_genai.Type.STRING },
            meilleurMoment: { type: import_genai.Type.STRING },
            opportunites: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING }
            },
            risques: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING }
            },
            resumeEchanges: { type: import_genai.Type.STRING }
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
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", isGeminiActive: !!ai });
});
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}
start().catch((err) => {
  console.error("Failed to start server:", err);
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
