import { FastifyPluginAsync } from 'fastify';
import fsPromises from 'fs/promises'; // 使用 fs/promises 以支持 Promise
import path from 'path';
import fastifyPlugin from 'fastify-plugin';
import pino from 'pino';

const logsPlugin: FastifyPluginAsync = async (fastify) => {
    const logDir = path.join(__dirname, '../logs');
    const logFilePath = path.join(logDir, 'server.log');
    try {
        await fsPromises.mkdir(logDir, { recursive: true });
        console.log('Log directory created:', logDir);
    } catch (err) {
        console.error('Error creating log directory:', err);
    }
    const isProduction = process.env.NODE_ENV === 'production';
    const logger = pino(
        isProduction
            ? pino.destination(logFilePath)
            : { level: 'info', transport: { target: 'pino-pretty', options: { colorize: true } } }
    );
    const formatDate = (date: Date): string => {
        const pad = (num: number) => (num < 10 ? '0' + num : num);
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    fastify.addHook('onRequest', async (request, reply) => {
        (request as any).startTime = process.hrtime();
        const now = new Date();
        const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // UTC +8
        (request as any).requestTime = formatDate(beijingTime); // 记录请求时间
    });
    fastify.addHook('onResponse', async (request, reply) => {
        const [seconds, nanoseconds] = process.hrtime((request as any).startTime);
        const responseTime = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
        // 记录日志
        logger.info({
            method: request.method,
            url: request.url,
            query: request.query,
            body: request.body,
            status: reply.statusCode,
            responseTime: `${responseTime} ms`,
            requestTime: (request as any).requestTime // 添加请求时间
        }, 'operation log');
    });
    fastify.addHook('onClose', async (instance) => {
        logger.info('Server is closing');
    });
};
export default fastifyPlugin(logsPlugin);
