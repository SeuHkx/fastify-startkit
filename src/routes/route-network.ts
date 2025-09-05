import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { controllerNetwork, controllerGetNetwork } from '@/controllers/controller-network';

/**
 * 网络设置相关路由
 */
const networkRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    // 保存网络设置接口
    app.post('/network-settings', controllerNetwork);
    
    // 获取网络设置接口
    app.get('/network-settings', controllerGetNetwork);
};

export default networkRoute;
