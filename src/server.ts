import Fastify, { FastifyInstance } from 'fastify'
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();
const port = Number(process.env.PORT) || 3000;
const app:FastifyInstance = Fastify({
    logger: {
        transport: {target: '@fastify/one-line-logger',
        }
    }
});

app.register(import('@fastify/formbody'))
app.register(import('@fastify/multipart'))
app.register(import('@fastify/cors'), {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});
app.register(import('./plugins/logs-plugin'))
const start = async () => {
    try {
        app.register(routes);
        await app.listen({
            port:port
        });
        console.log(`Server is running at http://localhost:${port}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();