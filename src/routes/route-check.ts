import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import controllerCheck from "@/controllers/controller-check";
const checkRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.post('/check', controllerCheck);
};

export default checkRoute;