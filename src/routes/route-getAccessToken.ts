
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import controllerGetAccessToken from "@/controllers/controller-getAccessToken";
const getAccessTokenRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.post('/getAccessToken', controllerGetAccessToken);
};

export default getAccessTokenRoute;