import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
    serviceGetDeviceInstances,
    serviceAddDeviceInstance,
    serviceUpdateDeviceInstance,
    serviceDeleteDeviceInstance,
    serviceDeleteDeviceInstances,
    serviceGetDeviceInstancesByType,
    serviceGetDeviceInstanceForEdit
} from '@/services/service-device-instances';

/**
 * 设备实例请求体接口
 */
interface DeviceInstanceRequestBody {
    name: string;
    deviceTypeId: string;
    conaddr: string;
    retadd: string;
    // 独立点位配置字段
    independentPoints?: any[];
}

/**
 * 批量删除设备实例请求体接口
 */
interface DeleteDeviceInstancesRequestBody {
    deviceIds: string[];
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
 * 获取设备实例列表控制器
 */
export async function controllerGetDeviceInstances(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;

        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 调用服务层获取设备实例列表
        const result = await serviceGetDeviceInstances(fastify);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('获取设备实例列表控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '获取设备实例列表时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 添加设备实例控制器
 */
export async function controllerAddDeviceInstance(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;

        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 验证请求体
        const body = req.body as DeviceInstanceRequestBody;
        if (!body) {
            return reply.status(400).send({
                success: false,
                message: '请求体不能为空',
                statusCode: 400,
            });
        }

        // 调用服务层添加设备实例
        const result = await serviceAddDeviceInstance(fastify, {
            name: body.name,
            deviceTypeId: body.deviceTypeId,
            conaddr: body.conaddr,
            retadd: body.retadd,
            independentPoints: body.independentPoints || []
        } as any);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('添加设备实例控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '添加设备实例时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 更新设备实例控制器
 */
export async function controllerUpdateDeviceInstance(req: FastifyRequest, reply: FastifyReply) {
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
        const body = req.body as Partial<DeviceInstanceRequestBody>;
        if (!body) {
            return reply.status(400).send({
                success: false,
                message: '请求体不能为空',
                statusCode: 400,
            });
        }

    // 调用服务层更新设备实例（支持 channelOverrides）
    const result = await serviceUpdateDeviceInstance(fastify, id, body as any);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('更新设备实例控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '更新设备实例时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 删除设备实例控制器
 */
export async function controllerDeleteDeviceInstance(req: FastifyRequest, reply: FastifyReply) {
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

        // 调用服务层删除设备实例
        const result = await serviceDeleteDeviceInstance(fastify, id);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('删除设备实例控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '删除设备实例时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 批量删除设备实例控制器
 */
export async function controllerDeleteDeviceInstances(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;

        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 验证请求体
        const body = req.body as DeleteDeviceInstancesRequestBody;
        if (!body || !body.deviceIds) {
            return reply.status(400).send({
                success: false,
                message: '请求体不能为空，需要包含deviceIds字段',
                statusCode: 400,
            });
        }

        // 调用服务层批量删除设备实例
        const result = await serviceDeleteDeviceInstances(fastify, body.deviceIds);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('批量删除设备实例控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '批量删除设备实例时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 根据设备类型获取设备实例控制器
 */
export async function controllerGetDeviceInstancesByType(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;

        // 验证用户认证
        const authError = verifyAuth(req, reply);
        if (authError) return authError;

        // 获取设备类型ID参数
        const { typeId } = req.params as { typeId: string };
        if (!typeId) {
            return reply.status(400).send({
                success: false,
                message: '设备类型ID不能为空',
                statusCode: 400,
            });
        }

        // 调用服务层获取设备实例
        const result = await serviceGetDeviceInstancesByType(fastify, typeId);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('根据设备类型获取设备实例控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '获取设备实例时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 获取设备实例编辑数据控制器
 */
export async function controllerGetDeviceInstanceForEdit(req: FastifyRequest, reply: FastifyReply) {
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

        // 调用服务层获取设备编辑数据
        const result = await serviceGetDeviceInstanceForEdit(fastify, id);

        return reply.status(result.statusCode).send({
            success: result.success,
            message: result.message,
            data: result.data || null,
            statusCode: result.statusCode,
        });

    } catch (error) {
        console.error('获取设备实例编辑数据控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '获取设备实例编辑数据时发生未知错误',
            statusCode: 500,
        });
    }
}