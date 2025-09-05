import {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import { 
    serviceGetDigitalInputs, 
    serviceUpdateDigitalInputs, 
    serviceAddDigitalInput, 
    serviceDeleteDigitalInputs,
    serviceGetAvailableDevices
} from '@/services/service-digital-inputs';

/**
 * 数字输入接口
 */
interface DigitalInput {
    channel: string;
    device: string;
    status: number;
}

/**
 * 添加数字输入请求体接口
 */
interface AddDigitalInputRequestBody {
    channel: string;
    device: string;
    status: number;
}

/**
 * 更新数字输入请求体接口
 */
interface UpdateDigitalInputsRequestBody {
    digitalInputs: DigitalInput[];
}

/**
 * 删除数字输入请求体接口
 */
interface DeleteDigitalInputsRequestBody {
    channels: string[];
}

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
 * 获取数字输入列表控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerGetDigitalInputs(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 调用服务层获取数字输入列表
        const result = await serviceGetDigitalInputs(fastify);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('获取数字输入列表控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '获取数字输入列表时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 更新数字输入列表控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerUpdateDigitalInputs(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 验证请求体
        const body = req.body as UpdateDigitalInputsRequestBody;
        if (!body || !body.digitalInputs) {
            return reply.status(400).send({
                success: false,
                message: '请求体不能为空，需要包含digitalInputs字段',
                statusCode: 400,
            });
        }

        // 调用服务层更新数字输入列表
        const result = await serviceUpdateDigitalInputs(fastify, body.digitalInputs);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('更新数字输入列表控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '更新数字输入列表时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 添加数字输入控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerAddDigitalInput(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 验证请求体
        const body = req.body as AddDigitalInputRequestBody;
        if (!body) {
            return reply.status(400).send({
                success: false,
                message: '请求体不能为空',
                statusCode: 400,
            });
        }

        // 调用服务层添加数字输入
        const result = await serviceAddDigitalInput(fastify, {
            channel: body.channel,
            device: body.device,
            status: body.status
        });

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('添加数字输入控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '添加数字输入时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 删除数字输入控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerDeleteDigitalInputs(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 验证请求体
        const body = req.body as DeleteDigitalInputsRequestBody;
        if (!body || !body.channels) {
            return reply.status(400).send({
                success: false,
                message: '请求体不能为空，需要包含channels字段',
                statusCode: 400,
            });
        }

        // 调用服务层删除数字输入
        const result = await serviceDeleteDigitalInputs(fastify, body.channels);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('删除数字输入控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '删除数字输入时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 获取可用设备列表控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerGetAvailableDevices(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 调用服务层获取可用设备列表
        const result = await serviceGetAvailableDevices(fastify);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('获取可用设备列表控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '获取可用设备列表时发生未知错误',
            statusCode: 500,
        });
    }
}
