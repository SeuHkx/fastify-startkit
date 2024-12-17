import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { uploadController } from '@/controllers/controller-upload';

const uploadRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.get('/upload', uploadController);
};

export default uploadRoutes;