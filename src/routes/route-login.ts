import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { controllerLogin } from '@/controllers/controller-login';

const loginRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.post('/login', controllerLogin);
};

export default loginRoute;