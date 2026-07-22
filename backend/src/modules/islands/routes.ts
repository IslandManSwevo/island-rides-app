import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';

export async function islandRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const islands = await prisma.island.findMany({ where: { active: true }, orderBy: { id: 'asc' } });
    return { islands };
  });
}

/** 🌐 GET /v1/protection-plans — checkout tier picker (mockup 04). */
export async function protectionPlanRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const plans = await prisma.protectionPlan.findMany({
      where: { active: true },
      orderBy: { feeBps: 'asc' },
    });
    return { plans };
  });
}
