import {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import { 
    serviceGetDevices, 
    serviceUpdateDevices, 
    serviceAddDevice, 
    serviceDeleteDevices,
    serviceGetDeviceTypes,
    serviceGetDeviceType,
    serviceAddDeviceType,
    serviceUpdateDeviceType,
    serviceDeleteDeviceType,
    serviceAddDeviceToDataTxt
} from '@/services/service-devices';

/**
 * 点位配置接口
 */
interface PointConfig {
    id: number;
    type: 'DI' | 'DO' | 'AI' | 'AO';
    code: string;
    statusFeedback: string;
    value: number;
}

/**
 * 设备类型接口
 */
interface DeviceType {
    name: string;
    code: string;
    status: boolean;
    points: PointConfig[];
}

/**
 * 添加设备请求体接口
 */
interface AddDeviceRequestBody {
    name: string;
    type: string;
    DINum: number;
    DONum: number;
    AINum: number;
    conaddr: string;
    retadd: string;
    points: PointConfig[];
}

/**
 * 更新设备请求体接口
 */
interface UpdateDevicesRequestBody {
    devices: DeviceType[];
}

/**
 * 删除设备请求体接口
 */
interface DeleteDevicesRequestBody {
    deviceNames: string[];
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
 * 获取设备列表控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerGetDevices(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 调用服务层获取设备列表
        const result = await serviceGetDevices(fastify);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('获取设备列表控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '获取设备列表时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 更新设备列表控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerUpdateDevices(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 验证请求体
        const body = req.body as UpdateDevicesRequestBody;
        if (!body || !body.devices) {
            return reply.status(400).send({
                success: false,
                message: '请求体不能为空，需要包含devices字段',
                statusCode: 400,
            });
        }

        // 调用服务层更新设备列表
        const result = await serviceUpdateDevices(fastify, body.devices);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('更新设备列表控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '更新设备列表时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 添加设备控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerAddDevice(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 验证请求体
        const body = req.body as AddDeviceRequestBody;
        if (!body) {
            return reply.status(400).send({
                success: false,
                message: '请求体不能为空',
                statusCode: 400,
            });
        }

        // 调用服务层添加设备到data.txt格式
        const result = await serviceAddDeviceToDataTxt(fastify, {
            name: body.name,
            type: body.type,
            DINum: body.DINum,
            DONum: body.DONum,
            AINum: body.AINum,
            conaddr: body.conaddr,
            retadd: body.retadd,
            points: body.points
        });

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('添加设备控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '添加设备时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 删除设备控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerDeleteDevices(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 验证请求体
        const body = req.body as DeleteDevicesRequestBody;
        if (!body || !body.deviceNames) {
            return reply.status(400).send({
                success: false,
                message: '请求体不能为空，需要包含deviceNames字段',
                statusCode: 400,
            });
        }

        // 调用服务层删除设备
        const result = await serviceDeleteDevices(fastify, body.deviceNames);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('删除设备控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '删除设备时发生未知错误',
            statusCode: 500,
        });
    }
}

// ===================== 设备类型管理控制器 =====================

/**
 * 获取设备类型列表控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerGetDeviceTypes(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 调用服务层获取设备类型列表
        const result = await serviceGetDeviceTypes(fastify);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('获取设备类型列表控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '获取设备类型列表时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 获取单个设备类型控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerGetDeviceType(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 获取设备ID参数
        const { id } = req.params as { id: string };
        if (!id) {
            return reply.status(400).send({
                success: false,
                message: '设备ID不能为空',
                statusCode: 400,
            });
        }

        // 调用服务层获取单个设备类型
        const result = await serviceGetDeviceType(fastify, id);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('获取设备类型详情控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '获取设备类型详情时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 添加设备类型控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerAddDeviceType(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 验证请求体
        const body = req.body as DeviceType;
        if (!body) {
            return reply.status(400).send({
                success: false,
                message: '请求体不能为空',
                statusCode: 400,
            });
        }

        // 调用服务层添加设备类型
        const result = await serviceAddDeviceType(fastify, body);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('添加设备类型控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '添加设备类型时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 更新设备类型控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerUpdateDeviceType(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 获取设备ID参数
        const { id } = req.params as { id: string };
        if (!id) {
            return reply.status(400).send({
                success: false,
                message: '设备ID不能为空',
                statusCode: 400,
            });
        }

        // 验证请求体
        const body = req.body as Partial<DeviceType>;
        if (!body) {
            return reply.status(400).send({
                success: false,
                message: '请求体不能为空',
                statusCode: 400,
            });
        }

        // 调用服务层更新设备类型
        const result = await serviceUpdateDeviceType(fastify, id, body);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('更新设备类型控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '更新设备类型时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 删除设备类型控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerDeleteDeviceType(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        
        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 获取设备ID参数
        const { id } = req.params as { id: string };
        if (!id) {
            return reply.status(400).send({
                success: false,
                message: '设备ID不能为空',
                statusCode: 400,
            });
        }

        // 调用服务层删除设备类型
        const result = await serviceDeleteDeviceType(fastify, id);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('删除设备类型控制器错误:', error);
        
        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '删除设备类型时发生未知错误',
            statusCode: 500,
        });
    }
}
