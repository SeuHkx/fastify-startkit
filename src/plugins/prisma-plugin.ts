import type {FastifyInstance,FastifyPluginAsync, FastifyPluginOptions} from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient
    }
}

const prismaPlugin:FastifyPluginAsync<FastifyPluginOptions> = async (fastify)=>{
    const prisma = new PrismaClient();
    await prisma.$connect();
    fastify.decorate('prisma', prisma);
    fastify.addHook('onClose', async (server) => {
        await server.prisma.$disconnect();
    });
}
export default fastifyPlugin(prismaPlugin);