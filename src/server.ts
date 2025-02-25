import Fastify, { FastifyInstance } from 'fastify'
import path from "path";

const app:FastifyInstance = Fastify({
    logger: {
        transport: {
            target: '@fastify/one-line-logger',
        }
    }
});
(async ()=>{
    await app.register(import('@fastify/formbody'))
    await app.register(import('@fastify/multipart'))
    await app.register(import('@fastify/cors'), {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    await app.register(import('@/plugins/errorHandler-plugin'));
    await app.register(import('@/plugins/env-plugin'));
    await app.register(import('@/plugins/config-plugin'));
    await app.register(import('@/plugins/logs-plugin'));
    await app.register(import('@/plugins/prisma-plugin'));
    await app.register(import('@fastify/cookie'));
    await app.register(import('@/plugins/axios-plugin'),{
        baseURL:app.env.PROXY_BASE_URL,
    });
    await app.register(import('@fastify/view'),{
        engine: {
            ejs: import('ejs')
        },
        root: path.join(__dirname, 'views'),
        viewExt:'ejs'
    });
    await app.register(import('@fastify/static'),{
        root: path.join(__dirname, '../public'),
        prefix: '/public/'
    });
    await app.register(import('@/plugins/auth-plugin'),{
        secret: app.env.JWT_SECRET,
        noAuthRoutes:['/login','/public']
    });
    const port = Number(app.env?.APP_PORT) || 3000;
    const start = async () => {
        try {
            await app.register(import('@/routes'));
            await app.listen({
                port:port,
                host: '0.0.0.0'
            });
            app.log.info(`Server is running at http://localhost:${port}`);
        } catch (err) {
            app.log.error(err);
            process.exit(1);
        }
    };
    await start();
})();
