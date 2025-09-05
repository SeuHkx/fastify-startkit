import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { 
    controllerGetDigitalInputs, 
    controllerUpdateDigitalInputs, 
    controllerAddDigitalInput, 
    controllerDeleteDigitalInputs,
    controllerGetAvailableDevices
} from '@/controllers/controller-digital-inputs';

/**
 * 数字输入相关路由
 */
const digitalInputsRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    // 获取数字输入列表接口
    app.get('/digital-inputs', controllerGetDigitalInputs);
    
    // 更新数字输入列表接口
    app.put('/digital-inputs', controllerUpdateDigitalInputs);
    
    // 添加数字输入接口
    app.post('/digital-inputs', controllerAddDigitalInput);
    
    // 删除数字输入接口
    app.delete('/digital-inputs', controllerDeleteDigitalInputs);
    
    // 获取可用设备列表接口
    app.get('/digital-inputs/available-devices', controllerGetAvailableDevices);
};

export default digitalInputsRoute;
