import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { 
    controllerGetDevices, 
    controllerUpdateDevices, 
    controllerAddDevice, 
    controllerDeleteDevices 
} from '@/controllers/controller-devices';

/**
 * 设备类型相关路由
 */
const devicesRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    // 获取设备列表接口
    app.get('/devices', controllerGetDevices);
    
    // 更新设备列表接口
    app.put('/devices', controllerUpdateDevices);
    
    // 添加设备接口
    app.post('/devices', controllerAddDevice);
    
    // 删除设备接口
    app.delete('/devices', controllerDeleteDevices);
};

export default devicesRoute;
