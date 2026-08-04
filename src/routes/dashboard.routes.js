import express from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const filter = req.user.role === 'Commercial' ? { commercialId: req.user.id } : {};
    const [
      total,
      byStatus,
      byPriority,
      value,
      tasks,
      scoreStats,
      topLeadsByScore
    ] = await prisma.$transaction([
      prisma.lead.count({ where: filter }),
      prisma.lead.groupBy({ by: ['statut'], where: filter, _count: { _all: true } }),
      prisma.lead.groupBy({ by: ['priorite'], where: filter, _count: { _all: true } }),
      prisma.lead.aggregate({ where: filter, _sum: { valeurEstimee: true } }),
      prisma.tache.count({
        where: {
          ...(req.user.role === 'Commercial' ? { utilisateurId: req.user.id } : {}),
          statut: { not: 'Terminee' },
          dateEcheance: { lt: new Date() }
        }
      }),
      prisma.lead.aggregate({ where: filter, _avg: { score: true }, _max: { score: true }, _min: { score: true } }),
      prisma.lead.findMany({
        where: filter,
        orderBy: { score: 'desc' },
        take: 5,
        select: { id: true, nom: true, prenom: true, score: true, entreprise: { select: { nom: true } } }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalLeads: total,
        pipeline: byStatus,
        priorites: byPriority,
        valeurEstimee: value._sum.valeurEstimee || 0,
        tachesEnRetard: tasks,
        scores: {
          moyen: Number(scoreStats._avg.score || 0).toFixed(2),
          max: scoreStats._max.score || 0,
          min: scoreStats._min.score || 0,
          topLeads: topLeadsByScore
        }
      }
    });
  } catch (e) {
    next(e);
  }
});

export default router;
