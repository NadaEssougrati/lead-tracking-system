import pg from "pg";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const sqlHost = process.env.SQL_HOST || "127.0.0.1";
const sqlUser = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const sqlPassword = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;
const sqlDbName = process.env.SQL_DB_NAME || "lead_man";

if (!sqlHost || !sqlUser || !sqlPassword || !sqlDbName) {
  console.error("Missing database environment variables.");
  process.exit(1);
}

const pool = new Pool({
  host: sqlHost,
  user: sqlUser,
  password: sqlPassword,
  database: sqlDbName,
});

async function main() {
  console.log("Connecting to PostgreSQL database...");
  const client = await pool.connect();
  
  try {
    console.log("Starting database transaction...");
    await client.query("BEGIN");

    // 1. Truncate tables to ensure a clean slate and re-run safety
    console.log("Clearing existing database tables...");
    await client.query(`
      TRUNCATE TABLE 
        notification, 
        devis, 
        tache, 
        activite, 
        attribution, 
        lead, 
        utilisateur, 
        entreprise 
      CASCADE;
    `);

    // 2. Hash role-specific passwords
    const salt = await bcrypt.genSalt(10);
    const hashes = {
      Administrateur: await bcrypt.hash("admin123", salt),
      Manager: await bcrypt.hash("manager123", salt),
      Commercial: await bcrypt.hash("commercial123", salt),
      AgentMarketing: await bcrypt.hash("marketing123", salt)
    };

    // 3. Create Users
    console.log("Seeding utilisateur accounts...");
    
    // We need 1 Admin, 2 Managers, 4 Commerciaux, 2 AgentMarketing
    const usersToInsert = [
      { prenom: "Jean", nom: "Dupont", email: "admin@example.com", role: "Administrateur" },
      { prenom: "Sophie", nom: "Martin", email: "manager1@example.com", role: "Manager" },
      { prenom: "Marc", nom: "Bernard", email: "manager2@example.com", role: "Manager" },
      { prenom: "Thomas", nom: "Dubois", email: "commercial1@example.com", role: "Commercial" },
      { prenom: "Julie", nom: "Petit", email: "commercial2@example.com", role: "Commercial" },
      { prenom: "Lucas", nom: "Robert", email: "commercial3@example.com", role: "Commercial" },
      { prenom: "Emma", nom: "Richard", email: "commercial4@example.com", role: "Commercial" },
      { prenom: "Antoine", nom: "Moreau", email: "marketing1@example.com", role: "AgentMarketing" },
      { prenom: "Léa", nom: "Laurent", email: "marketing2@example.com", role: "AgentMarketing" },
    ];

    const seededUsers = [];
    for (const u of usersToInsert) {
      const res = await client.query(
        `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING id, nom, prenom, email, role`,
        [u.nom, u.prenom, u.email, hashes[u.role], u.role]
      );
      seededUsers.push(res.rows[0]);
    }

    const admin = seededUsers.find(u => u.role === "Administrateur");
    const managers = seededUsers.filter(u => u.role === "Manager");
    const commerciaux = seededUsers.filter(u => u.role === "Commercial");
    const marketings = seededUsers.filter(u => u.role === "AgentMarketing");

    console.log(`Seeded ${seededUsers.length} users successfully.`);

    // 4. Create Entreprises
    console.log("Seeding enterprise details...");
    const enterprisesToInsert = [
      { nom: "TechNova Solutions", secteur: "Technologies", adresse: "15 Rue de la Paix", ville: "Paris", pays: "France", telephone: "0142750001", siteWeb: "https://technova.io" },
      { nom: "ImmoInvest France", secteur: "Immobilier", adresse: "45 Avenue des Champs-Élysées", ville: "Paris", pays: "France", telephone: "0143890204", siteWeb: "https://immoinvest.fr" },
      { nom: "GreenEnergy SA", secteur: "Énergies renouvelables", adresse: "8 Boulevard Vauban", ville: "Lille", pays: "France", telephone: "0320456182", siteWeb: "https://greenenergy.fr" },
    ];

    const seededEnterprises = [];
    for (const ent of enterprisesToInsert) {
      const res = await client.query(
        `INSERT INTO entreprise (nom, secteur, adresse, ville, pays, telephone, site_web)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [ent.nom, ent.secteur, ent.adresse, ent.ville, ent.pays, ent.telephone, ent.siteWeb]
      );
      seededEnterprises.push(res.rows[0]);
    }
    console.log(`Seeded ${seededEnterprises.length} enterprises.`);

    // 5. Create Leads
    console.log("Seeding leads...");
    const statuses = ["Nouveau", "PremierContact", "Qualification", "PropositionCommerciale", "Negociation", "Gagne", "Perdu"];
    const sources = ["SiteWeb", "ReseauxSociaux", "Recommandation", "Emailing", "Salon", "Telephone"];
    const priorities = ["Basse", "Moyenne", "Haute"];

    // We generate ~25 leads
    const leadCount = 25;
    const seededLeads = [];

    for (let i = 0; i < leadCount; i++) {
      const prenom = faker.person.firstName();
      const nom = faker.person.lastName();
      const email = faker.internet.email({ firstName: prenom, lastName: nom }).toLowerCase();
      const telephone = faker.phone.number({ style: "national" });
      const address = faker.location.streetAddress();
      const city = faker.location.city();
      
      // Distribute status so every status is represented at least once
      let status;
      if (i < statuses.length) {
        status = statuses[i];
      } else {
        status = faker.helpers.arrayElement(statuses);
      }

      const source = faker.helpers.arrayElement(sources);
      const priority = faker.helpers.arrayElement(priorities);
      const score = faker.number.int({ min: 10, max: 95 });
      const estimatedValue = parseFloat(faker.commerce.price({ min: 1000, max: 80000, dec: 2 }));
      const notes = faker.helpers.maybe(() => faker.lorem.paragraph()) || null;
      
      // Associate with a random enterprise (90% chance)
      const entreprise = faker.helpers.arrayElement(seededEnterprises);
      const enterpriseId = faker.helpers.maybe(() => entreprise.id, { probability: 0.9 }) || null;

      // Assign to commercial (Nouveau might not be assigned, other stages usually are)
      let commercialId = null;
      if (status !== "Nouveau" || faker.datatype.boolean(0.5)) {
        const commercial = faker.helpers.arrayElement(commerciaux);
        commercialId = commercial.id;
      }

      // Creation date spread over the last 60 days
      const dateCreation = faker.date.between({
        from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        to: new Date()
      });
      
      // Last activity is between creation date and now
      const dateLastActivity = faker.date.between({
        from: dateCreation,
        to: new Date()
      });

      const res = await client.query(
        `INSERT INTO lead (nom, prenom, telephone, email, adresse, ville, pays, source, statut, priorite, score, valeur_estimee, notes, entreprise_id, commercial_id, date_creation, derniere_activite)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        [nom, prenom, telephone, email, address, city, "France", source, status, priority, score, estimatedValue, notes, enterpriseId, commercialId, dateCreation, dateLastActivity]
      );
      seededLeads.push(res.rows[0]);
    }

    console.log(`Seeded ${seededLeads.length} leads across various statuses.`);

    // 6. Seed Attribution records (ownership history)
    console.log("Seeding lead assignment history (attribution)...");
    for (const lead of seededLeads) {
      if (lead.commercial_id) {
        await client.query(
          `INSERT INTO attribution (date_attribution, lead_id, commercial_id)
           VALUES ($1, $2, $3)`,
          [lead.date_creation, lead.id, lead.commercial_id]
        );
      }
    }

    // 7. Seed Activite logs (1-4 activities per lead)
    console.log("Seeding activity logs (activite)...");
    const activityTypes = ["Appel", "Email", "RendezVous", "Note", "ChangementStatut"];
    const activityDescriptions = {
      Appel: ["Appel de qualification initial effectué", "Relance téléphonique, le client réfléchit", "Tentative d'appel, répondeur", "Discussion téléphonique sur le budget"],
      Email: ["Email de présentation envoyé", "Email de relance commerciale", "Réception de l'email de confirmation du client", "Envoi de la brochure commerciale"],
      RendezVous: ["Rendez-vous de cadrage réalisé", "Démonstration produit en visioconférence", "Négociation en présentiel au siège du client"],
      Note: ["Prise de notes : Le client semble très intéressé", "Note interne : Attente de validation de la direction", "Lead importé depuis les campagnes Facebook Ads"],
    };

    for (const lead of seededLeads) {
      // 1. Crucial for AgentMarketing: 50% chance lead is marked as created by AgentMarketing
      // This supports the Lead visibility rule lookup in findLeadsForMarketing.
      const creator = faker.helpers.arrayElement(seededUsers); // Can be any user
      
      // Insert initial "Lead créé" activity log
      await client.query(
        `INSERT INTO activite (type, description, date_activite, lead_id, utilisateur_id)
         VALUES ('Note', 'Lead créé', $1, $2, $3)`,
        [lead.date_creation, lead.id, creator.id]
      );

      // Generate 0 to 3 additional random activities
      const additionalActivitiesCount = faker.number.int({ min: 0, max: 3 });
      for (let j = 0; j < additionalActivitiesCount; j++) {
        const type = faker.helpers.arrayElement(["Appel", "Email", "RendezVous", "Note"]);
        const list = activityDescriptions[type];
        const desc = faker.helpers.arrayElement(list);
        const actDate = faker.date.between({ from: lead.date_creation, to: lead.derniere_activite });
        const actor = faker.helpers.arrayElement(seededUsers);

        await client.query(
          `INSERT INTO activite (type, description, date_activite, lead_id, utilisateur_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [type, desc, actDate, lead.id, actor.id]
        );
      }

      // Add a status change log if the lead is in an advanced stage
      if (lead.statut !== "Nouveau") {
        await client.query(
          `INSERT INTO activite (type, description, date_activite, lead_id, utilisateur_id)
           VALUES ('ChangementStatut', $1, $2, $3, $4)`,
          [`Statut modifié de 'Nouveau' à '${lead.statut}'`, lead.derniere_activite, lead.id, lead.commercial_id || admin.id]
        );
      }
    }

    // 8. Seed Taches (Tasks)
    console.log("Seeding task logs (tache)...");
    const taskTitles = ["Rappeler le client", "Envoyer la proposition de prix", "Préparer la démonstration technique", "Valider les prérequis avec le technique", "Envoyer email de relance"];
    const taskStatuses = ["AFaire", "EnCours", "Terminee"];

    for (let t = 0; t < 10; t++) {
      const title = faker.helpers.arrayElement(taskTitles);
      const desc = faker.lorem.sentence();
      const status = faker.helpers.arrayElement(taskStatuses);
      
      const lead = faker.helpers.arrayElement(seededLeads);
      const assignedUser = lead.commercial_id ? seededUsers.find(u => u.id === lead.commercial_id) : faker.helpers.arrayElement(commerciaux);

      // Some tasks are overdue (due date in the past, state not completed)
      let dueDate;
      if (t < 3) {
        // Overdue task (created in past, due 5 days ago)
        dueDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      } else {
        // Future task
        dueDate = new Date(Date.now() + faker.number.int({ min: 1, max: 20 }) * 24 * 60 * 60 * 1000);
      }

      await client.query(
        `INSERT INTO tache (titre, description, statut, date_echeance, date_creation, lead_id, utilisateur_id)
         VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
        [title, desc, status, dueDate, lead.id, assignedUser.id]
      );
    }

    // 9. Seed Devis (Proposals)
    console.log("Seeding devis (proposals)...");
    const devisStatuses = ["Brouillon", "Envoye", "Accepte", "Refuse"];
    
    // Select leads that are in PropositionCommerciale, Negociation, Gagne, or Perdu
    const advancedLeads = seededLeads.filter(l => 
      ["PropositionCommerciale", "Negociation", "Gagne", "Perdu"].includes(l.statut)
    );

    for (let d = 0; d < advancedLeads.length; d++) {
      const lead = advancedLeads[d];
      const reference = `DEV-2026-${String(d + 1).padStart(4, "0")}`;
      const amount = lead.valeur_estimee > 0 ? lead.valeur_estimee : parseFloat(faker.commerce.price({ min: 5000, max: 30000 }));
      
      // Align devis status with lead pipeline status
      let status = "Brouillon";
      if (lead.statut === "PropositionCommerciale") status = "Envoye";
      else if (lead.statut === "Negociation") status = faker.helpers.arrayElement(["Envoye", "Brouillon"]);
      else if (lead.statut === "Gagne") status = "Accepte";
      else if (lead.statut === "Perdu") status = "Refuse";

      await client.query(
        `INSERT INTO devis (reference, montant, statut, date_creation, lead_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [reference, amount, status, lead.derniere_activite, lead.id]
      );
    }

    // 10. Seed Notifications
    console.log("Seeding system notifications...");
    const notificationTemplates = [
      { titre: "Nouveau lead attribué", message: "Le lead {leadName} vous a été attribué par votre manager." },
      { titre: "Rappel de tâche urgente", message: "La tâche '{taskTitle}' sur le lead {leadName} est en retard." },
      { titre: "Statut de devis mis à jour", message: "Le devis {reference} a été marqué comme {status}." }
    ];

    for (let n = 0; n < 6; n++) {
      const template = faker.helpers.arrayElement(notificationTemplates);
      const user = faker.helpers.arrayElement(seededUsers);
      const isRead = faker.datatype.boolean(0.4); // 40% read rate

      let message = template.message;
      if (message.includes("{leadName}")) {
        const lead = faker.helpers.arrayElement(seededLeads);
        message = message.replace("{leadName}", `${lead.prenom} ${lead.nom}`);
      }
      if (message.includes("{taskTitle}")) {
        message = message.replace("{taskTitle}", faker.helpers.arrayElement(taskTitles));
      }
      if (message.includes("{reference}")) {
        message = message.replace("{reference}", `DEV-2026-${faker.number.int({ min: 100, max: 999 })}`);
      }
      if (message.includes("{status}")) {
        message = message.replace("{status}", faker.helpers.arrayElement(devisStatuses).toLowerCase());
      }

      await client.query(
        `INSERT INTO notification (titre, message, est_lue, date_creation, utilisateur_id)
         VALUES ($1, $2, $3, NOW(), $4)`,
        [template.titre, message, isRead, user.id]
      );
    }

    console.log("Committing transaction...");
    await client.query("COMMIT");
    console.log("Database seeded successfully!");
    
    // Print out credentials summary
    console.log("\n==========================================");
    console.log("DEVELOPMENT SANDBOX CREDENTIALS");
    console.log("==========================================");
    const passMap = {
      Administrateur: "admin123",
      Manager: "manager123",
      Commercial: "commercial123",
      AgentMarketing: "marketing123"
    };
    seededUsers.forEach(u => {
      console.log(`- Role: ${String(u.role).padEnd(16)} | Identifiant: ${String(u.email.split("@")[0]).padEnd(12)} | Password: ${passMap[u.role]}`);
    });
    console.log("==========================================\n");

  } catch (error) {
    console.error("Error occurred during database seeding. Rolling back transaction...", error);
    await client.query("ROLLBACK");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
