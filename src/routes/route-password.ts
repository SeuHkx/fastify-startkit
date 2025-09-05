import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { controllerPassword } from '@/controllers/controller-password';

/**
 * 密码相关路由
 */
const passwordRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    // 修改密码接口
    app.post('/change-password', controllerPassword);
};

export default passwordRoute;
