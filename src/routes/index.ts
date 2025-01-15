import { FastifyPluginAsync } from 'fastify';
import uploadRoute from '@/routes/route-upload';
import loginRoute from "@/routes/route-login";

const routes: FastifyPluginAsync = async (app) => {
    app.register(uploadRoute);
    app.register(loginRoute);
};
export default routes;