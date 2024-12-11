import { FastifyPluginAsync } from 'fastify';
import uploadRoutes from './index-upload';

const routes: FastifyPluginAsync = async (app) => {
    app.register(uploadRoutes);
};
export default routes;