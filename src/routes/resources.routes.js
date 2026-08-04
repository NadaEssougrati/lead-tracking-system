const router = require("express").Router();
const prisma = require("../lib/prisma");
const { authenticate, allowRoles } = require("../middleware/auth");

router.use(authenticate);

const normalizeTaskStatus = (statut) => {
  if (!statut) return undefined;
  const mapping = {
    AFaire: 'AFaire',
    EnCours: 'EnCours',
    Terminee: 'Terminee',
    'À faire': 'AFaire',
    'En cours': 'EnCours',
    'Terminée': 'Terminee',
    Afaire: 'AFaire',
    Termine: 'Terminee'
  };
  return mapping[statut] || mapping[statut?.trim()] || statut;
};

const normalizeActivityType = (type) => {
  if (!type) return undefined;
  const mapping = {
    Appel: 'Appel',
    Email: 'Email',
    RendezVous: 'RendezVous',
    'Rendez-vou': 'RendezVous',
    'Rendez-vous': 'RendezVous',
    'Rendez vous': 'RendezVous',
    rendezvous: 'RendezVous',
    Note: 'Note',
    appel: 'Appel',
    email: 'Email',
    note: 'Note'
  };
  return mapping[type] || mapping[type?.trim()] || type;
};

router.get("/activities", async (req, res, next) => {
  try {
    const where = {
      ...(req.query.leadId && { leadId: req.query.leadId }),
      ...(req.query.type && { type: normalizeActivityType(req.query.type) })
    };
    const activities = await prisma.activite.findMany({
      where,
      include: {
        utilisateur: { select: { id: true, nom: true, prenom: true } },
        lead: { select: { id: true, nom: true, prenom: true } }
      },
      orderBy: { dateActivite: 'desc' }
    });
    res.json({ success: true, data: activities });
  } catch (e) {
    next(e);
  }
});

router.post("/activities", async (req, res, next) => {
  try {
    const activityData = {
      leadId: req.body.leadId,
      type: normalizeActivityType(req.body.type),
      dateActivite: req.body.dateActivite,
      description: req.body.description,
      dureeMinutes: req.body.dureeMinutes,
      utilisateurId: req.user.id
    };
    const activity = await prisma.activite.create({
      data: activityData,
      include: {
        utilisateur: { select: { id: true, nom: true, prenom: true } },
        lead: { select: { id: true, nom: true, prenom: true } }
      }
    });
    await prisma.lead.update({
      where: { id: activity.leadId },
      data: { derniereActivite: activity.dateActivite }
    });
    res.status(201).json({ success: true, data: activity });
  } catch (e) {
    next(e);
  }
});

router.patch("/activities/:id", async (req, res, next) => {
  try {
    const patchData = { ...req.body };
    if (req.body.type) patchData.type = normalizeActivityType(req.body.type);
    const activity = await prisma.activite.update({
      where: { id: req.params.id },
      data: patchData,
      include: {
        utilisateur: { select: { id: true, nom: true, prenom: true } },
        lead: { select: { id: true, nom: true, prenom: true } }
      }
    });
    res.json({ success: true, data: activity });
  } catch (e) {
    next(e);
  }
});

router.delete("/activities/:id", async (req, res, next) => {
  try {
    await prisma.activite.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.get("/tasks", async (req, res, next) => {
  try {
    const where = {
      ...(req.user.role === 'Commercial' ? { utilisateurId: req.user.id } : {}),
      ...(req.query.leadId && { leadId: req.query.leadId }),
      ...(req.query.statut && { statut: normalizeTaskStatus(req.query.statut) }),
      ...(req.query.critique !== undefined ? { critique: req.query.critique === 'true' } : {})
    };
    const tasks = await prisma.tache.findMany({
      where,
      include: {
        lead: { select: { id: true, nom: true, prenom: true } },
        utilisateur: { select: { id: true, nom: true, prenom: true } }
      },
      orderBy: { dateEcheance: 'asc' }
    });
    res.json({ success: true, data: tasks });
  } catch (e) {
    next(e);
  }
});

router.post("/tasks", async (req, res, next) => {
  try {
    const taskData = {
      titre: req.body.titre,
      description: req.body.description,
      statut: normalizeTaskStatus(req.body.statut) || 'AFaire',
      dateEcheance: req.body.dateEcheance,
      leadId: req.body.leadId,
      utilisateurId: req.body.utilisateurId || req.user.id,
      critique: req.body.critique || false
    };

    if (!taskData.titre || !taskData.dateEcheance || !taskData.leadId) {
      return res.status(400).json({ success: false, message: 'titre, dateEcheance et leadId sont requis pour créer une tâche.' });
    }

    const task = await prisma.tache.create({
      data: taskData,
      include: {
        lead: { select: { id: true, nom: true, prenom: true } },
        utilisateur: { select: { id: true, nom: true, prenom: true } }
      }
    });
    res.status(201).json({ success: true, data: task });
  } catch (e) {
    next(e);
  }
});

router.patch("/tasks/:id", async (req, res, next) => {
  try {
    const patchData = { ...req.body };
    if (req.body.statut) patchData.statut = normalizeTaskStatus(req.body.statut);
    const task = await prisma.tache.update({
      where: { id: req.params.id },
      data: patchData,
      include: {
        lead: { select: { id: true, nom: true, prenom: true } },
        utilisateur: { select: { id: true, nom: true, prenom: true } }
      }
    });
    res.json({ success: true, data: task });
  } catch (e) {
    next(e);
  }
});

router.delete("/tasks/:id", async (req, res, next) => {
  try {
    await prisma.tache.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.get("/quotes", async (req, res, next) => {
  try {
    const quotes = await prisma.devis.findMany({
      where: req.query.leadId ? { leadId: req.query.leadId } : {},
      include: { lead: { select: { id: true, nom: true, prenom: true } } },
      orderBy: { dateCreation: 'desc' }
    });
    res.json({ success: true, data: quotes });
  } catch (e) {
    next(e);
  }
});

router.post("/quotes", async (req, res, next) => {
  try {
    const quote = await prisma.devis.create({ data: req.body });
    res.status(201).json({ success: true, data: quote });
  } catch (e) {
    next(e);
  }
});

router.patch("/quotes/:id", async (req, res, next) => {
  try {
    const quote = await prisma.devis.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: quote });
  } catch (e) {
    next(e);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { utilisateurId: req.user.id },
      orderBy: { dateCreation: 'desc' }
    });
    res.json({ success: true, data: notifications });
  } catch (e) {
    next(e);
  }
});

router.patch("/notifications/:id/read", async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({ where: { id: req.params.id }, data: { estLue: true } });
    res.json({ success: true, data: notification });
  } catch (e) {
    next(e);
  }
});

router.get("/companies", async (req, res, next) => {
  try {
    const companies = await prisma.entreprise.findMany({
      include: { _count: { select: { leads: true } } },
      orderBy: { nom: 'asc' }
    });
    res.json({ success: true, data: companies });
  } catch (e) {
    next(e);
  }
});

router.post("/companies", allowRoles("Administrateur", "Manager", "AgentMarketing"), async (req, res, next) => {
  try {
    const company = await prisma.entreprise.create({ data: req.body });
    res.status(201).json({ success: true, data: company });
  } catch (e) {
    next(e);
  }
});

router.patch("/companies/:id", allowRoles("Administrateur", "Manager", "AgentMarketing"), async (req, res, next) => {
  try {
    const company = await prisma.entreprise.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: company });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
