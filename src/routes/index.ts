import { FastifyPluginAsync } from 'fastify';
import uploadRoute from '@/routes/route-upload';
import loginRoute from "@/routes/route-login";
import findItemRoute from "@/routes/route-findItems";
import deleteItemRoute from "@/routes/route-deleteItem";
import checkRoute from "@/routes/route-check";
import reportRoute from "@/routes/route-report";
import loginVRoute from "@/routes/views/route-v-login";
import mainVRoute from "@/routes/views/route-v-main";
import getAccessTokenRoute from "@/routes/route-getAccessToken";
import checkAllRoute from "@/routes/route-checkAll";

const routes: FastifyPluginAsync = async (app) => {
    app.register(uploadRoute);
    app.register(loginRoute);
    app.register(loginVRoute);
    app.register(findItemRoute);
    app.register(deleteItemRoute);
    app.register(checkRoute);
    app.register(checkAllRoute);
    app.register(reportRoute);
    app.register(mainVRoute);
    app.register(getAccessTokenRoute);
};
export default routes;