import { FastifyPluginAsync } from 'fastify';
import uploadRoute from '@/routes/route-upload';
import loginRoute from "@/routes/route-login";
import addItemRoute from "@/routes/route-addItem";
import findItemRoute from "@/routes/route-findItems";
import updateItemRoute from "@/routes/route-updateItem";
import deleteItemRoute from "@/routes/route-deleteItem";

const routes: FastifyPluginAsync = async (app) => {
    app.register(uploadRoute);
    app.register(loginRoute);
    app.register(addItemRoute);
    app.register(findItemRoute);
    app.register(updateItemRoute);
    app.register(deleteItemRoute);
};
export default routes;