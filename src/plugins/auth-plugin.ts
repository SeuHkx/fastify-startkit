import type {FastifyInstance,FastifyRequest,FastifyReply,FastifyPluginAsync, FastifyPluginOptions} from 'fastify';
import fastifyPlugin from 'fastify-plugin';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: any
    }
}
const authPlugin: FastifyPluginAsync<FastifyPluginOptions> = async (fastify:FastifyInstance, options) => {
    fastify.register(import('@fastify/jwt'), {
        secret: options.secret,
        cookie: {
            cookieName: 'token',
            signed: false
        },
        sign: {
            expiresIn: '10h',
        },
    });
    fastify.decorate('authenticate', async (request:FastifyRequest, reply:FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            if (request.raw.url === '/main') {
                return reply.redirect('/login');
            } else {
                return reply.status(401).send({
                    success: false,
                    message: '未登录授权',
                    statusCode: 401,
                });
            }
        }
    });
    fastify.addHook('onRequest', async (request, reply) => {
        const urlPath = request.url.split('?')[0];
        if (options.noAuthRoutes) {
            if (options.noAuthRoutes.includes('*')) {
                return;
            }
            for (const route of options.noAuthRoutes) {
                if (urlPath.startsWith(route)) {
                    return;
                }
            }
        }
        await fastify.authenticate(request, reply);
    });
}
export default fastifyPlugin(authPlugin);
