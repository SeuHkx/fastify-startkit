import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import controllerVMain from "@/controllers/views/controller-v-main";

const mainVRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.get('/main', controllerVMain);
};

export default mainVRoute;