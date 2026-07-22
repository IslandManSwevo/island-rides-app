import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';

export async function islandRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const islands = await prisma.island.findMany({ where: { active: true }, orderBy: { id: 'asc' } });
    return { islands };
  });
}
