import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);

// Initialize AI Client
let ai = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    console.log("AI client initialized successfully for CRM.");
  } catch (error) {
    console.error("Failed to initialize AI Client in routes:", error);
  }
}

router.post("/leads/:leadId/analyze", async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.leadId },
      include: { activites: true, entreprise: true }
    });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead introuvable.' });
    }

    // 1. Calculate Fallback Data (Smart Heuristic)
    const fallbackScore = Math.min(100, Math.max(10, 
      (lead.priorite === 'Haute' ? 35 : lead.priorite === 'Moyenne' ? 20 : 10) +
      (Number(lead.valeurEstimee) > 100000 ? 25 : Number(lead.valeurEstimee) > 40000 ? 15 : 5) +
      (lead.source === 'Recommandation' ? 20 : lead.source === 'Salon' ? 15 : 5) +
      (lead.activites.length > 2 ? 15 : 5) +
      (lead.notes?.length > 50 ? 5 : 0)
    ));

    const fallbackData = {
      scoreLead: fallbackScore,
      actionRecommandee: lead.activites.length 
        ? 'Planifier une relance personnalisée et confirmer les prochaines étapes.' 
        : 'Établir un premier contact dans les 24 heures.',
      meilleurMomentRelance: 'Mardi matin entre 9h30 et 11h00',
      resumeEchanges: `${lead.activites.length} activité(s) enregistrée(s) pour ce prospect.`,
      alerte: lead.activites.length === 0 ? 'Aucune interaction enregistrée.' : null,
      leadId: lead.id
    };

    let isFallback = true;
    let data = { ...fallbackData };

    // 2. Try Gemini AI if active
    if (ai) {
      try {
        const prompt = `Vous êtes un assistant de vente intelligent et expert CRM de "Tracking Lead System".
Analysez les données du prospect (Lead) et ses dernières activités pour générer une fiche d'évaluation et de recommandation commerciale.

Fiche du prospect :
- Société : ${lead.entreprise?.nom || 'Non spécifiée'}
- Nom complet : ${lead.prenom} ${lead.nom}
- Secteur/Ville : ${lead.ville || 'Non spécifié'}, ${lead.pays || 'Non spécifié'}
- Statut : ${lead.statut}
- Priorité commerciale : ${lead.priorite}
- Budget estimé : ${lead.valeurEstimee} EUR
- Source d'acquisition : ${lead.source}
- Notes internes : ${lead.notes || 'Aucune note'}

Activités récentes enregistrées :
${JSON.stringify(lead.activites || [], null, 2)}

Fournissez les éléments suivants sous forme de JSON structuré en respectant scrupuleusement ce schéma :
{
  "score": <nombre entre 10 et 99 calculant la probabilité de conversion en pourcentage>,
  "actionRecommandee": "<une phrase décrivant la meilleure action immédiate et concrète à réaliser>",
  "meilleurMomentRelance": "<le meilleur jour et créneau horaire de la semaine pour relancer le prospect>",
  "resumeEchanges": "<un résumé succinct et percutant de l'historique des échanges sous forme de court paragraphe en français>",
  "alerte": "<une alerte importante s'il y a un risque de perdre le lead ou un manque d'activité, sinon null>"
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
                meilleurMomentRelance: { type: Type.STRING },
                resumeEchanges: { type: Type.STRING },
                alerte: { type: Type.STRING }
              },
              required: ["score", "actionRecommandee", "meilleurMomentRelance", "resumeEchanges"]
            }
          }
        });

        const text = response.text || "";
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleanText);

        data = {
          scoreLead: result.score,
          actionRecommandee: result.actionRecommandee,
          meilleurMomentRelance: result.meilleurMomentRelance,
          resumeEchanges: result.resumeEchanges,
          alerte: result.alerte || null,
          leadId: lead.id
        };
        isFallback = false;
      } catch (geminiError) {
        console.error("Gemini AI evaluation failed, falling back to static rules:", geminiError);
      }
    }

    // 3. Save evaluation & update lead score in a single transaction
    const analysis = await prisma.$transaction([
      prisma.assistantIA.create({ data }),
      prisma.lead.update({
        where: { id: lead.id },
        data: { score: data.scoreLead }
      })
    ]);

    res.json({
      success: true,
      data: analysis[0],
      isFallback
    });
  } catch (e) {
    next(e);
  }
});

export default router;
