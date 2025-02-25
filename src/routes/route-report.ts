import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import controllerReport from "@/controllers/controller-report";
const reportRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.post('/report', controllerReport);
};

export default reportRoute;