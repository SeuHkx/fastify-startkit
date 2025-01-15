import type {FastifyInstance,FastifyRequest,FastifyReply,FastifyPluginAsync, FastifyPluginOptions} from 'fastify';
import fastifyPlugin from 'fastify-plugin';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: any
    }
}
const authPlugin: FastifyPluginAsync<FastifyPluginOptions> = async (fastify:FastifyInstance, options) => {
    fastify.register(import('@fastify/jwt'), {
        secret: options.secret
    });
    fastify.decorate('authenticate', async (request:FastifyRequest, reply:FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            return reply.status(401).send({
                success: false,
                message: 'Unauthorized',
                statusCode: 401,
            });
        }
    });
    fastify.addHook('onRequest', async (request, reply) => {
        // 检查是否需要跳过验证
        const urlPath = request.url.split('?')[0];
        if (options.noAuthRoutes && options.noAuthRoutes.includes(urlPath)) {
            return;
        }
        await fastify.authenticate(request, reply);
    });
}
export default fastifyPlugin(authPlugin);
