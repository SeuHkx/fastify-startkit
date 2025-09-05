import {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import servicePassword from "@/services/service-password";

/**
 * 修改密码控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerPassword(req: FastifyRequest, reply: FastifyReply) {
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

        // 获取请求体参数
        const body = req.body as { newPassword: string };
        
        if (!body || !body.newPassword) {
            return reply.status(400).send({
                success: false,
                message: '请提供新密码',
                statusCode: 400,
            });
        }

        // 调用服务修改密码
        const result = await servicePassword(fastify, { newPassword: body.newPassword });
        
        // 返回结果
        reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            statusCode: result.statusCode,
        });
        
    } catch (error) {
        console.error('修改密码控制器异常:', error);
        reply.status(500).send({
            success: false,
            message: '服务器内部错误',
            statusCode: 500,
        });
    }
}