import { FastifyPluginAsync } from 'fastify';
import fsPromises from 'fs/promises'; // 使用 fs/promises 以支持 Promise
import path from 'path';
import fastifyPlugin from 'fastify-plugin';
import pino from 'pino';

const logsPlugin: FastifyPluginAsync = async (fastify) => {
    const logDir  = path.join(__dirname, '../logs');
    const outsDir = path.join(logDir, 'outs');
    const errorDir= path.join(logDir, 'error');
    try {
        await fsPromises.mkdir(logDir, { recursive: true });
        console.log('Log directory created:', logDir);
        // 创建 outs 目录
        await fsPromises.mkdir(outsDir, { recursive: true });
        console.log('Outs directory created:', outsDir);
        // 创建 error 目录
        await fsPromises.mkdir(errorDir, { recursive: true });
        console.log('Error directory created:', errorDir);
    } catch (err) {
        console.error('Error creating log directory:', err);
    }
    const logger = pino({
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname'
            }
        }
    });
    const formatDate = (date: Date): string => {
        const pad = (num: number) => (num < 10 ? '0' + num : num);
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    fastify.addHook('onRequest', async (request, reply) => {
        (request as any).startTime = process.hrtime();
        const now = new Date();
        const beijingTime = new Date(now.getTime()); // UTC +8
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
