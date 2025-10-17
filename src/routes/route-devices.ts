import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
    controllerGetDevices,
    controllerUpdateDevices,
    controllerAddDevice,
    controllerDeleteDevices,
    controllerGetDeviceTypes,
    controllerGetDeviceType,
    controllerAddDeviceType,
    controllerUpdateDeviceType,
    controllerDeleteDeviceType
} from '@/controllers/controller-devices';

/**
 * 设备相关路由
 */
const devicesRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    // 设备管理接口
    app.get('/devices', controllerGetDevices);
    app.post('/devices/update', controllerUpdateDevices);
    app.post('/devices', controllerAddDevice);
    app.post('/devices/delete', controllerDeleteDevices);

    // 设备类型管理接口
    app.get('/devices/types', controllerGetDeviceTypes);
    app.get('/devices/types/:id', controllerGetDeviceType);
    app.post('/devices/types', controllerAddDeviceType);
    app.post('/devices/types/:id/delete', controllerDeleteDeviceType);
    app.post('/devices/types/:id', controllerUpdateDeviceType);
};

export default devicesRoute;
