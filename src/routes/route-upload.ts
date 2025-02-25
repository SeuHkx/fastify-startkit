import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { uploadController } from '@/controllers/controller-upload';

const uploadRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.post('/upload', uploadController);
};

export default uploadRoute;