import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {controllerFindItems} from "@/controllers/controller-findItems";
const findItemsRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.post('/find', controllerFindItems);
};

export default findItemsRoute;