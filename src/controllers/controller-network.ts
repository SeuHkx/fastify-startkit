import {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import serviceNetwork from "@/services/service-network";

/**
 * 网络设置请求体接口
 */
interface NetworkRequestBody {
    macAddress: string;
    ipAddress: string;
    subnetMask: string;
    gateway: string;
}

/**
 * 网络设置控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerNetwork(req: FastifyRequest, reply: FastifyReply) {
    try {
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
        } catch (jwtError) {
            return reply.status(401).send({
                success: false,
                message: '登录已过期，请重新登录',
                statusCode: 401,
            });
        }

        // 验证请求体
        const body = req.body as NetworkRequestBody;
        if (!body) {
            return reply.status(400).send({
                success: false,
                message: '请求体不能为空',
                statusCode: 400,
            });
        }

        // 调用服务层保存网络设置
        const result = await serviceNetwork(fastify, {
            macAddress: body.macAddress,
            ipAddress: body.ipAddress,
            subnetMask: body.subnetMask,
            gateway: body.gateway
        });

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('网络设置控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '保存网络设置时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 获取网络设置控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerGetNetwork(req: FastifyRequest, reply: FastifyReply) {
    try {
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
        } catch (jwtError) {
            return reply.status(401).send({
                success: false,
                message: '登录已过期，请重新登录',
                statusCode: 401,
            });
        }

        // 读取当前网络设置
        if (!fastify.env.DATABASE_TXT || !fastify.env.DATABASE_JSON) {
            return reply.status(500).send({
                success: false,
                message: '数据库配置缺失',
                statusCode: 500,
            });
        }

        const { parseDataToJson } = await import('@/utils/dataParser');
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        return reply.status(200).send({
            success: true,
            message: '获取网络设置成功',
            data: jsonData.network || {},
            statusCode: 200,
        });

    } catch (error) {
        console.error('获取网络设置控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '获取网络设置时发生未知错误',
            statusCode: 500,
        });
    }
}
