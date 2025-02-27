import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import controllerVLogin from "@/controllers/views/controller-v-login";

const loginVRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.get('/login', controllerVLogin);
};

export default loginVRoute;