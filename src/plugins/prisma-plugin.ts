import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import { PrismaClient } from '@prisma/client';
import fastifyPlugin from 'fastify-plugin';

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}

/**
 * Prisma 数据库客户端插件
 * 将 PrismaClient 实例注册到 Fastify 实例中
 */
const prismaPlugin: FastifyPluginAsync<FastifyPluginOptions> = async (fastify: FastifyInstance) => {
    // 打印环境变量用于调试
    const dbUrl = process.env.DATABASE_URL;
    fastify.log.info(`🔍 初始化 Prisma 客户端...`);
    fastify.log.info(`   DATABASE_URL: ${dbUrl || '(未设置)'}`);
    
    const prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // 测试数据库连接
    try {
        await prisma.$connect();
        fastify.log.info('✅ Prisma 数据库连接成功');
        
        // 优化 SQLite 配置
        try {
            // SQLite PRAGMA 命令需要使用 $queryRawUnsafe (因为会返回结果)
            await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL');
            await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000');
            fastify.log.info('✅ SQLite 优化配置已应用 (WAL 模式 + 5秒超时)');
        } catch (pragmaError: any) {
            fastify.log.warn(`⚠️  SQLite 优化配置应用失败: ${pragmaError?.message}`);
            // 继续运行,优化失败不是致命错误
        }
    } catch (error: any) {
        const dbUrl = process.env.DATABASE_URL || '(未设置)';
        fastify.log.error('❌ Prisma 数据库连接失败:');
        fastify.log.error(`   错误信息: ${error?.message || error}`);
        fastify.log.error(`   DATABASE_URL: ${dbUrl}`);
        if (error?.stack) {
            console.error('详细错误堆栈:', error.stack);
        }
    }

    // 将 prisma 客户端添加到 fastify 实例
    fastify.decorate('prisma', prisma);

    // 应用关闭时断开数据库连接
    fastify.addHook('onClose', async (instance) => {
        await instance.prisma.$disconnect();
        instance.log.info('Prisma 数据库连接已关闭');
    });
};

export default fastifyPlugin(prismaPlugin);
