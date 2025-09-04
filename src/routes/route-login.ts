import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { controllerLogin, controllerLogout } from '@/controllers/controller-login';
const loginRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.post('/login', controllerLogin);
    app.post('/logout', controllerLogout);
};

export default loginRoute;