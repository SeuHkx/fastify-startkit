import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import controllerCheckAll from "@/controllers/controller-checkAll";
const checkAllRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.post('/checkAll', controllerCheckAll);
};

export default checkAllRoute;