import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
    serviceConvertToDataJsonFormat,
    serviceGetDataJsonFormat,
    serviceExportDataTxt
} from '@/services/service-data-conversion';
import path from 'path';
import fs from 'fs';

/**
 * 验证用户登录状态的通用函数
 */
const verifyAuth = (req: FastifyRequest, reply: FastifyReply) => {
    const fastify: FastifyInstance = req.server;

    // 验证用户是否已登录
    const token: any = req.cookies.token;
    if (!token) {
        return reply.status(401).send({
            success: false,
            message: '未登录，请先登录',
            statusCode: 401,
        });
    }

    // 验证JWT token
    try {
        fastify.jwt.verify(token);
        return null; // 验证成功
    } catch (jwtError) {
        return reply.status(401).send({
            success: false,
            message: '登录已过期，请重新登录',
            statusCode: 401,
        });
    }
};

/**
 * 手动触发数据转换控制器
 */
export async function controllerConvertToDataJsonFormat(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;

        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 调用服务层进行数据转换
        const result = await serviceConvertToDataJsonFormat(fastify);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('数据转换控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '数据转换时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 获取转换后的 data.json 数据控制器
 */
export async function controllerGetDataJsonFormat(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;

        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 调用服务层获取数据
        const result = await serviceGetDataJsonFormat(fastify);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('获取 data.json 数据控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '获取 data.json 数据时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 导出/生成 data.txt 并提供下载信息
 */
export async function controllerExportDataTxt(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;

        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        const result = await serviceExportDataTxt(fastify);
        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });
    } catch (error) {
        console.error('导出 data.txt 控制器错误:', error);
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '导出 data.txt 时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 获取配置文件列表（动态）
 */
export async function controllerGetConfigList(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;

        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 统一以 /public/data 下的文件为准
        const base = path.join(process.cwd(), 'public/data');
        const items = [
            { name: '设备配置文件', fileName: 'data.txt', filePath: '/public/data/data.txt', description: '包含设备网络配置、设备信息和输入输出点配置' },
            { name: '设备类型配置文件', fileName: 'devices-type-data.json', filePath: '/public/data/devices-type-data.json', description: '设备类型定义和点位配置信息' },
            // { name: '设备实例配置文件', fileName: 'devices.json', filePath: '/public/data/devices.json', description: '设备实例列表与自定义点位' },
        ];

        const list = await Promise.all(items.map(async (it, idx) => {
            const abs = path.join(base, it.fileName);
            try {
                const stat = await fs.promises.stat(abs);
                return {
                    id: idx + 1,
                    name: it.name,
                    fileName: it.fileName,
                    filePath: it.filePath,
                    description: it.description,
                    size: `${Math.max(1, Math.ceil(stat.size / 1024))} KB`,
                    lastModified: new Date(stat.mtime).toISOString().slice(0,10)
                };
            } catch {
                return {
                    id: idx + 1,
                    name: it.name,
                    fileName: it.fileName,
                    filePath: it.filePath,
                    description: it.description,
                    size: '—',
                    lastModified: ''
                };
            }
        }));

        return reply.send({ success: true, data: list, statusCode: 200 });
    } catch (error) {
        console.error('获取配置文件列表控制器错误:', error);
        return reply.status(500).send({ success: false, message: '获取配置文件列表失败', statusCode: 500 });
    }
}
