import { FastifyPluginAsync } from 'fastify';
import loginRoute from "@/routes/route-login";
import passwordRoute from "@/routes/route-password";
import networkRoute from "@/routes/route-network";
import devicesRoute from "@/routes/route-devices";
import digitalInputsRoute from "@/routes/route-digital-inputs";
import loginVRoute from "@/routes/views/route-v-login";
import mainVRoute from "@/routes/views/route-v-main";


const routes: FastifyPluginAsync = async (app) => {
    app.register(loginRoute);
    app.register(passwordRoute);
    app.register(networkRoute);
    app.register(devicesRoute);
    app.register(digitalInputsRoute);
    app.register(loginVRoute);
    app.register(mainVRoute);
};
export default routes;