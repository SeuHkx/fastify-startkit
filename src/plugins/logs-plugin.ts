import {FastifyPluginAsync, FastifyPluginOptions} from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import pino from 'pino';

const logsPlugin: FastifyPluginAsync<FastifyPluginOptions> = async (fastify) => {
    const logger = pino({
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname'
            }
        },
        formatters: {
            log(object) {
                return {
                    msg: `operation log | method: "${object.method}" | url: "${object.url}" | query: ${JSON.stringify(object.query)} | body:${JSON.stringify(object.body)} | status: ${object.status} | responseTime: "${object.responseTime}" | requestTime: "${object.requestTime}"`
                };
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
        });
    });
    fastify.addHook('onClose', async (instance) => {
        logger.info('Server is closing');
    });
};
export default fastifyPlugin(logsPlugin);
