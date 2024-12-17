import { FastifyPluginAsync } from 'fastify';
import uploadRoutes from '@/routes/index-upload';

const routes: FastifyPluginAsync = async (app) => {
    app.register(uploadRoutes);
};
export default routes;