/**
 * Seed data: islands (from the app's src/constants/islands.ts) and the
 * platform protection plans (design/02-user-flows.md).
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Demo host + verified fleet so a fresh database shows cars on first run.
 * Idempotent; safe to re-run. Sign in as demo@keylo.bs / keylodemo123.
 */
async function seedDemoFleet() {
  const passwordHash = await argon2.hash('keylodemo123', { type: argon2.argon2id });
  const user = await prisma.user.upsert({
    where: { email: 'demo@keylo.bs' },
    update: {},
    create: {
      email: 'demo@keylo.bs',
      passwordHash,
      firstName: 'Danielle',
      lastName: 'Rolle',
      role: 'host',
      verificationStatus: 'verified',
    },
  });

  const host = await prisma.hostProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      handle: 'daniellesfleet',
      displayName: "Danielle's Island Fleet",
      tagline: 'Nassau born and raised. Garage-kept cars, cold Goombay Punch on pickup.',
      bio: 'Seven cars across New Providence. Airport pickup always free.',
      responseTimeMins: 15,
      payoutEnabled: true,
      paypalPayerEmail: 'demo@keylo.bs',
    },
  });

  const fleet = [
    { make: 'Toyota', model: 'RAV4', year: 2024, type: 'suv', rate: 7400, instant: true, airport: true },
    { make: 'Honda', model: 'CR-V', year: 2022, type: 'suv', rate: 6200, instant: false, airport: true },
    { make: 'Jeep', model: 'Wrangler', year: 2023, type: 'suv', rate: 8900, instant: true, airport: false },
    { make: 'Ford', model: 'Mustang Convertible', year: 2023, type: 'convertible', rate: 11500, instant: true, airport: true },
  ];

  for (const [i, v] of fleet.entries()) {
    const existing = await prisma.vehicle.findFirst({ where: { hostId: host.id, make: v.make, model: v.model } });
    if (existing) continue;
    await prisma.vehicle.create({
      data: {
        hostId: host.id,
        islandId: i === 3 ? 'freeport' : 'nassau',
        make: v.make,
        model: v.model,
        year: v.year,
        vehicleType: v.type,
        driveSide: 'LHD',
        seats: v.type === 'convertible' ? 4 : 5,
        transmission: 'automatic',
        fuelType: 'gasoline',
        description: `Well-kept ${v.make} ${v.model}, ready for island roads.`,
        features: ['A/C', 'Bluetooth', 'Backup camera'],
        dailyRateCents: v.rate,
        securityDepositCents: 50_000,
        airportPickup: v.airport,
        airportFeeCents: v.airport ? 2500 : 0,
        deliveryAvailable: true,
        deliveryFeeCents: 2000,
        deliveryRadiusKm: 15,
        instantBook: v.instant,
        verificationStatus: 'verified',
        listedAt: new Date(),
        extras: {
          create: [
            { name: 'Child seat', priceCents: 1500, perTrip: true },
            { name: 'Beach kit — cooler, chairs, umbrella', priceCents: 2500, perTrip: true },
          ],
        },
      },
    });
  }

  // Admin account to work the insurance review queue.
  await prisma.user.upsert({
    where: { email: 'admin@keylo.bs' },
    update: { role: 'admin' },
    create: {
      email: 'admin@keylo.bs',
      passwordHash: await argon2.hash('keyloadmin123', { type: argon2.argon2id }),
      firstName: 'KeyLo',
      lastName: 'Admin',
      role: 'admin',
      verificationStatus: 'verified',
    },
  });

  // One car pending insurance review so the admin queue isn't empty on first run.
  const pending = await prisma.vehicle.findFirst({ where: { hostId: host.id, make: 'Nissan' } });
  if (!pending) {
    const v = await prisma.vehicle.create({
      data: {
        hostId: host.id,
        islandId: 'nassau',
        make: 'Nissan',
        model: 'Note',
        year: 2021,
        vehicleType: 'hatchback',
        driveSide: 'RHD',
        seats: 5,
        transmission: 'automatic',
        fuelType: 'gasoline',
        features: ['A/C', 'Bluetooth'],
        dailyRateCents: 5200,
        securityDepositCents: 40_000,
        verificationStatus: 'pending', // awaiting insurance approval — not listed
      },
    });
    await prisma.vehiclePhoto.create({ data: { vehicleId: v.id, key: 'vehicle_photo/seed/note.jpg', position: 0, isPrimary: true } });
    await prisma.vehicleDocument.create({ data: { vehicleId: v.id, kind: 'insurance', key: 'document/seed/note-insurance.pdf', status: 'pending' } });
  }

  console.log('Seeded demo host (demo@keylo.bs / keylodemo123), admin (admin@keylo.bs / keyloadmin123), 4 live + 1 pending-review vehicle');
}

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

  await seedDemoFleet();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
