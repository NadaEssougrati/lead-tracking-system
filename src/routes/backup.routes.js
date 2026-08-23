import express from "express";
import prisma from "../lib/prisma.js";
import { authenticate, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(allowRoles("Administrateur"));

// Helper to build date range filter
const getDateFilter = (startDate, endDate, fieldName) => {
  if (!startDate && !endDate) return undefined;
  const filter = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);
  return { [fieldName]: filter };
};

// 1. Export database backup
router.post("/export", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;

    const exportFilter = (fieldName) => getDateFilter(startDate, endDate, fieldName);

    const users = await prisma.utilisateur.findMany({
      where: exportFilter("dateCreation")
    });

    const companies = await prisma.entreprise.findMany(); // Companies don't have date, export all

    const leads = await prisma.lead.findMany({
      where: exportFilter("dateCreation")
    });

    const attributions = await prisma.attribution.findMany({
      where: exportFilter("dateAttribution")
    });

    const activities = await prisma.activite.findMany({
      where: exportFilter("dateActivite")
    });

    const tasks = await prisma.tache.findMany({
      where: exportFilter("dateCreation")
    });

    const quotes = await prisma.devis.findMany({
      where: exportFilter("dateCreation")
    });

    const notifications = await prisma.notification.findMany({
      where: exportFilter("dateCreation")
    });

    const histories = await prisma.historique.findMany({
      where: exportFilter("dateAction")
    });

    const documents = await prisma.documentJoint.findMany({
      where: exportFilter("dateAjout")
    });

    const assistantIA = await prisma.assistantIA.findMany({
      where: exportFilter("dateGeneration")
    });

    const emails = await prisma.email.findMany({
      where: exportFilter("dateCreation")
    });

    res.json({
      success: true,
      data: {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        startDate: startDate || null,
        endDate: endDate || null,
        data: {
          users,
          companies,
          leads,
          attributions,
          activities,
          tasks,
          quotes,
          notifications,
          histories,
          documents,
          assistantIA,
          emails
        }
      }
    });
  } catch (e) {
    next(e);
  }
});

// 2. Import database backup
router.post("/import", async (req, res, next) => {
  try {
    let { mode, mergeStrategy, backupData } = req.body;

    // Auto-detect and normalize legacy flat backups
    if (backupData && !backupData.data && (backupData.leads || backupData.users)) {
      backupData = {
        version: "1.0",
        data: backupData
      };
    }

    if (!backupData || !backupData.data) {
      return res.status(400).json({ success: false, message: "Données de sauvegarde invalides." });
    }

    const {
      users = [],
      companies = [],
      leads = [],
      attributions = [],
      activities = [],
      tasks = [],
      quotes = [],
      notifications = [],
      histories = [],
      documents = [],
      assistantIA = [],
      emails = []
    } = backupData.data;

    if (mode === "replace") {
      // Clear all tables in safe dependency order
      await prisma.attribution.deleteMany({});
      await prisma.activite.deleteMany({});
      await prisma.tache.deleteMany({});
      await prisma.devis.deleteMany({});
      await prisma.notification.deleteMany({});
      await prisma.historique.deleteMany({});
      await prisma.documentJoint.deleteMany({});
      await prisma.assistantIA.deleteMany({});
      await prisma.email.deleteMany({});
      await prisma.lead.deleteMany({});
      await prisma.entreprise.deleteMany({});
      
      // Preserve currently logged in admin user to prevent lock-out
      const activeAdminId = req.user.id;
      await prisma.utilisateur.deleteMany({
        where: { id: { not: activeAdminId } }
      });

      // Insert users (skip active admin to avoid duplicate primary key)
      for (const u of users) {
        if (u.id === activeAdminId) continue;
        await prisma.utilisateur.create({
          data: {
            ...u,
            dateCreation: new Date(u.dateCreation)
          }
        });
      }

      // Insert companies
      for (const c of companies) {
        await prisma.entreprise.create({ data: c });
      }

      // Insert leads
      for (const l of leads) {
        await prisma.lead.create({
          data: {
            ...l,
            valeurEstimee: Number(l.valeurEstimee),
            dateCreation: new Date(l.dateCreation),
            derniereActivite: l.derniereActivite ? new Date(l.derniereActivite) : null
          }
        });
      }

      // Insert attributions
      for (const a of attributions) {
        await prisma.attribution.create({
          data: {
            ...a,
            dateAttribution: new Date(a.dateAttribution)
          }
        });
      }

      // Insert activities
      for (const act of activities) {
        await prisma.activite.create({
          data: {
            ...act,
            dateActivite: new Date(act.dateActivite)
          }
        });
      }

      // Insert tasks
      for (const t of tasks) {
        await prisma.tache.create({
          data: {
            ...t,
            dateEcheance: new Date(t.dateEcheance),
            dateCreation: new Date(t.dateCreation)
          }
        });
      }

      // Insert quotes
      for (const q of quotes) {
        await prisma.devis.create({
          data: {
            ...q,
            montant: Number(q.montant),
            dateCreation: new Date(q.dateCreation)
          }
        });
      }

      // Insert notifications
      for (const n of notifications) {
        await prisma.notification.create({
          data: {
            ...n,
            dateCreation: new Date(n.dateCreation)
          }
        });
      }

      // Insert histories
      for (const h of histories) {
        await prisma.historique.create({
          data: {
            ...h,
            dateAction: new Date(h.dateAction)
          }
        });
      }

      // Insert documents
      for (const docItem of documents) {
        await prisma.documentJoint.create({
          data: {
            ...docItem,
            dateAjout: new Date(docItem.dateAjout)
          }
        });
      }

      // Insert AI analysis
      for (const ia of assistantIA) {
        await prisma.assistantIA.create({
          data: {
            ...ia,
            dateGeneration: new Date(ia.dateGeneration)
          }
        });
      }

      // Insert emails
      for (const em of emails) {
        await prisma.email.create({
          data: {
            ...em,
            dateCreation: new Date(em.dateCreation)
          }
        });
      }

    } else {
      // Merge Mode
      // 1. Users
      for (const u of users) {
        const exist = await prisma.utilisateur.findUnique({ where: { id: u.id } });
        if (!exist) {
          await prisma.utilisateur.create({
            data: {
              ...u,
              dateCreation: new Date(u.dateCreation)
            }
          });
        }
      }

      // 2. Companies
      for (const c of companies) {
        const exist = await prisma.entreprise.findUnique({ where: { id: c.id } });
        if (!exist) {
          await prisma.entreprise.create({ data: c });
        }
      }

      // 3. Leads
      for (const l of leads) {
        // A lead is "similar" if it shares the same ID or same email
        const exist = await prisma.lead.findFirst({
          where: {
            OR: [
              { id: l.id },
              l.email ? { email: { equals: l.email, mode: 'insensitive' } } : undefined
            ].filter(Boolean)
          }
        });

        if (exist) {
          if (mergeStrategy === "replace") {
            // Update existing lead (keeping existing lead's ID to keep relations intact)
            await prisma.lead.update({
              where: { id: exist.id },
              data: {
                nom: l.nom,
                prenom: l.prenom,
                telephone: l.telephone,
                email: l.email,
                adresse: l.adresse,
                ville: l.ville,
                pays: l.pays,
                source: l.source,
                statut: l.statut,
                priorite: l.priorite,
                score: l.score,
                valeurEstimee: Number(l.valeurEstimee),
                nomProjet: l.nomProjet,
                notes: l.notes,
                entrepriseId: l.entrepriseId,
                commercialId: l.commercialId,
                derniereActivite: l.derniereActivite ? new Date(l.derniereActivite) : null
              }
            });
          }
          // If strategy is "keep", we skip / ignore the backup lead
        } else {
          // Insert as new
          await prisma.lead.create({
            data: {
              ...l,
              valeurEstimee: Number(l.valeurEstimee),
              dateCreation: new Date(l.dateCreation),
              derniereActivite: l.derniereActivite ? new Date(l.derniereActivite) : null
            }
          });
        }
      }

      // Merge other supporting tables (skip if ID exists, insert if new)
      const mergeTable = async (modelName, list, dateFields) => {
        for (const item of list) {
          const exist = await prisma[modelName].findUnique({ where: { id: item.id } });
          if (!exist) {
            const data = { ...item };
            for (const df of dateFields) {
              if (data[df]) data[df] = new Date(data[df]);
            }
            if (data.montant !== undefined) data.montant = Number(data.montant);
            await prisma[modelName].create({ data });
          }
        }
      };

      await mergeTable("attribution", attributions, ["dateAttribution"]);
      await mergeTable("activite", activities, ["dateActivite"]);
      await mergeTable("tache", tasks, ["dateEcheance", "dateCreation"]);
      await mergeTable("devis", quotes, ["dateCreation"]);
      await mergeTable("notification", notifications, ["dateCreation"]);
      await mergeTable("historique", histories, ["dateAction"]);
      await mergeTable("documentJoint", documents, ["dateAjout"]);
      await mergeTable("assistantIA", assistantIA, ["dateGeneration"]);
      await mergeTable("email", emails, ["dateCreation"]);
    }

    res.json({ success: true, message: "Restauration effectuée avec succès." });
  } catch (e) {
    next(e);
  }
});

export default router;
