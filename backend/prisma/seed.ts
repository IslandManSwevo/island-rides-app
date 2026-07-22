/**
 * Seed data: islands (from the app's src/constants/islands.ts) and the
 * platform protection plans (design/02-user-flows.md).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const islands = [
    {
      id: 'nassau',
      name: 'New Providence (Nassau)',
      features: ['City Life', 'Beaches', 'Shopping', 'Nightlife'],
    },
    {
      id: 'freeport',
      name: 'Grand Bahama (Freeport)',
      features: ['Duty-Free Shopping', 'Water Sports', 'Beaches', 'Resorts'],
    },
    {
      id: 'exuma',
      name: 'Exuma',
      features: ['Swimming Pigs', 'Nature', 'Adventures', 'Secluded Beaches'],
    },
  ];

  for (const island of islands) {
    await prisma.island.upsert({
      where: { id: island.id },
      update: island,
      create: island,
    });
  }

  const plans = [
    { id: 'minimum', name: 'Minimum', feeBps: 800, deductibleCents: 300_000 },
    { id: 'standard', name: 'Standard', feeBps: 1500, deductibleCents: 50_000 },
    { id: 'premium', name: 'Premium', feeBps: 2500, deductibleCents: 0 },
  ];

  for (const plan of plans) {
    await prisma.protectionPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }

  console.log('Seeded islands and protection plans');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
