import 'fastify';

declare module 'fastify' {
    interface FastifyInstance {
        env: {
            PORT: string;
        };
    }
}