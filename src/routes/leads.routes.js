import express from "express";
import prisma from "../lib/prisma.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { leadInclude } from "../lib/helpers.js";

const router = express.Router();
router.use(authenticate);

const normalizeLeadStatus = (statut) => {
  if (!statut) return undefined;
  const mapping = {
    Nouveau: 'Nouveau',
    nouveau: 'Nouveau',
    Contacte: 'PremierContact',
    contacté: 'PremierContact',
    contacte: 'PremierContact',
    'PremierContact': 'PremierContact',
    'Premier contact': 'PremierContact',
    Qualification: 'Qualification',
    qualifie: 'Qualification',
    qualifié: 'Qualification',
    'PropositionCommerciale': 'PropositionCommerciale',
    'Proposition commerciale': 'PropositionCommerciale',
    'proposition envoyer': 'PropositionCommerciale',
    'proposition envoyée': 'PropositionCommerciale',
    'Proposition envoyée': 'PropositionCommerciale',
    Proposition: 'PropositionCommerciale',
    Negociation: 'Negociation',
    negociation: 'Negociation',
    négociation: 'Negociation',
    Gagne: 'Gagne',
    gagne: 'Gagne',
    converti: 'Gagne',
    'converti(gagné)': 'Gagne',
    Perdu: 'Perdu',
    perdu: 'Perdu'
  };
  return mapping[statut] || mapping[statut?.trim()] || statut;
};

const leadStageOptions = [
  { value: 'Nouveau', label: 'Nouveau' },
  { value: 'PremierContact', label: 'Contacté' },
  { value: 'Qualification', label: 'Qualifié' },
  { value: 'PropositionCommerciale', label: 'Proposition envoyée' },
  { value: 'Negociation', label: 'Négociation' },
  { value: 'Gagne', label: 'Converti (Gagné)' },
  { value: 'Perdu', label: 'Perdu' }
];

const visibility = (req) => req.user.role === 'Commercial' ? { commercialId: req.user.id } : {};

router.get("/", async (req, res, next) => {
  try {
    const { search, statut, priorite, commercialId, page = 1, limit = 50 } = req.query;
    const where = {
      ...visibility(req),
      ...(statut && { statut: normalizeLeadStatus(statut) }),
      ...(priorite && { priorite }),
      ...(commercialId && { commercialId }),
      ...(search && {
        OR: [
          { nom: { contains: search, mode: 'insensitive' } },
          { prenom: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { entreprise: { nom: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };
    const [data, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        include: leadInclude,
        orderBy: { dateCreation: 'desc' },
        skip: (+page - 1) * +limit,
        take: Math.min(+limit, 100)
      }),
      prisma.lead.count({ where })
    ]);
    res.json({ success: true, data, meta: { total, page: +page, limit: +limit } });
  } catch (e) {
    next(e);
  }
});

router.get("/stages", async (req, res, next) => {
  try {
    return res.json({ success: true, data: leadStageOptions });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, ...visibility(req) },
      include: {
        ...leadInclude,
        activites: {
          include: { utilisateur: { select: { id: true, nom: true, prenom: true } } },
          orderBy: { dateActivite: 'desc' }
        },
        taches: { include: { utilisateur: { select: { id: true, nom: true, prenom: true } } } },
        devis: true,
        analysesIA: { orderBy: { dateGeneration: 'desc' }, take: 1 }
      }
    });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead introuvable.' });
    res.json({ success: true, data: lead });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      commercialId: req.body.commercialId || (req.user.role === 'Commercial' ? req.user.id : undefined),
      statut: normalizeLeadStatus(req.body.statut) || req.body.statut
    };
    if (!data.nom || !data.prenom || !data.source) {
      return res.status(400).json({ success: false, message: 'nom, prenom et source sont requis.' });
    }
    const lead = await prisma.lead.create({ data, include: leadInclude });
    await prisma.historique.create({
      data: {
        action: 'Création',
        description: 'Lead créé',
        leadId: lead.id,
        utilisateurId: req.user.id
      }
    });
    res.status(201).json({ success: true, data: lead });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const current = await prisma.lead.findFirst({ where: { id: req.params.id, ...visibility(req) } });
    if (!current) return res.status(404).json({ success: false, message: 'Lead introuvable.' });
    const patchData = { ...req.body };
    if (req.body.statut) patchData.statut = normalizeLeadStatus(req.body.statut);
    const lead = await prisma.lead.update({ where: { id: current.id }, data: patchData, include: leadInclude });
    await prisma.historique.create({
      data: {
        action: 'Modification',
        description: 'Informations du lead mises à jour',
        leadId: lead.id,
        utilisateurId: req.user.id
      }
    });
    res.json({ success: true, data: lead });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/assign", allowRoles("Administrateur", "Manager"), async (req, res, next) => {
  try {
    const { commercialId } = req.body;
    const lead = await prisma.lead.update({ where: { id: req.params.id }, data: { commercialId } });
    await prisma.attribution.create({ data: { leadId: lead.id, commercialId } });
    await prisma.notification.create({
      data: {
        titre: 'Nouveau lead attribué',
        message: `Le lead ${lead.prenom} ${lead.nom} vous a été attribué.`,
        utilisateurId: commercialId
      }
    });
    res.json({ success: true, data: lead });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const statut = normalizeLeadStatus(req.body.statut) || req.body.statut;
    const lead = await prisma.lead.update({ where: { id: req.params.id }, data: { statut } });
    await prisma.historique.create({
      data: {
        action: 'Changement de statut',
        description: `Statut: ${statut}`,
        leadId: lead.id,
        utilisateurId: req.user.id
      }
    });
    res.json({ success: true, data: lead });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", allowRoles("Administrateur", "Manager"), async (req, res, next) => {
  try {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
