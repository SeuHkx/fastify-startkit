import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { 
    controllerGetDeviceInstances,
    controllerAddDeviceInstance,
    controllerUpdateDeviceInstance,
    controllerDeleteDeviceInstance,
    controllerDeleteDeviceInstances,
    controllerGetDeviceInstancesByType,
    controllerGetDeviceInstanceForEdit
} from '@/controllers/controller-device-instances';

/**
 * 设备实例相关路由
 */
const deviceInstancesRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    // 设备实例管理接口
    app.get('/device-instances', controllerGetDeviceInstances);
    app.post('/device-instances', controllerAddDeviceInstance);
    app.get('/device-instances/:id/edit', controllerGetDeviceInstanceForEdit);
    app.post('/device-instances/:id', controllerUpdateDeviceInstance);
    app.post('/device-instances/:id/delete', controllerDeleteDeviceInstance);
    app.post('/device-instances/delete', controllerDeleteDeviceInstances);
    
    // 根据设备类型获取设备实例
    app.get('/device-instances/by-type/:typeId', controllerGetDeviceInstancesByType);
};

export default deviceInstancesRoute;