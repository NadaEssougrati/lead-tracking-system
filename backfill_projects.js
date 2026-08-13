import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Query leads including the linked enterprise relation to access its name
  const leads = await prisma.lead.findMany({
    include: {
      entreprise: true
    }
  });

  for (const lead of leads) {
    const societeName = lead.entreprise ? lead.entreprise.nom : '';
    
    // Match and assign custom projects based on actual company name
    let nomProjet = `Déploiement CRM - ${societeName || lead.nom || 'Client'}`;
    
    if (societeName === 'TechSolutions') nomProjet = 'Automatisation Relances Marketing';
    else if (societeName === 'Med Retail') nomProjet = 'Intégration ERP & Tracking';
    else if (societeName === 'GlobalTech Inc') nomProjet = 'Analyse Prédictive IA';
    else if (societeName === 'CasaNet') nomProjet = 'Tracking Leads de Vente';
    else if (societeName === 'Munich Automotive') nomProjet = 'Contrat Volume Automobile';
    else if (societeName === 'Maroc Solutions') nomProjet = 'Migration Cloud';
    
    await prisma.lead.update({
      where: { id: lead.id },
      data: { nomProjet }
    });
    console.log(`Updated lead ${lead.id} with nomProjet: ${nomProjet}`);
  }
  console.log("Backfill complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
