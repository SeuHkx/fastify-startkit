import {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import { serviceGetEnhancedDeviceList } from '@/services/service-device-management';

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
 * 获取增强设备列表控制器
 */
export async function controllerGetEnhancedDeviceList(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 调用服务层获取增强设备列表
        const result = await serviceGetEnhancedDeviceList(fastify);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('获取增强设备列表控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '获取增强设备列表时发生未知错误',
            statusCode: 500,
        });
    }
}