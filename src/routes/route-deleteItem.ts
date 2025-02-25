import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {controllerDeleteItem} from "@/controllers/controller-deleteItem";
const deleteItemRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.post('/delete', controllerDeleteItem);
};

export default deleteItemRoute;