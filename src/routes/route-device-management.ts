import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { controllerGetEnhancedDeviceList } from '@/controllers/controller-device-management';

/**
 * 设备管理相关路由
 */
const deviceManagementRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    // 获取增强设备列表
    app.get('/device-management', controllerGetEnhancedDeviceList);
};

export default deviceManagementRoute;
