import { FastifyPluginAsync } from 'fastify';
import loginRoute from "@/routes/route-login";
import passwordRoute from "@/routes/route-password";
import networkRoute from "@/routes/route-network";
import devicesRoute from "@/routes/route-devices";
import deviceInstancesRoute from "@/routes/route-device-instances";
import deviceManagementRoute from "@/routes/route-device-management";
import dataConversionRoute from "@/routes/route-data-conversion";
import dataTxtParserRoute from "@/routes/route-data-txt-parser";
import qrcodeRoute from "@/routes/route-qrcode";
import loginVRoute from "@/routes/views/route-v-login";
import mainVRoute from "@/routes/views/route-v-main";


const routes: FastifyPluginAsync = async (app) => {
    app.register(loginRoute);
    app.register(passwordRoute);
    app.register(networkRoute);
    app.register(devicesRoute);
    app.register(deviceInstancesRoute);
    app.register(deviceManagementRoute);
    app.register(dataConversionRoute);
    app.register(dataTxtParserRoute);
    app.register(qrcodeRoute);
    app.register(loginVRoute);
    app.register(mainVRoute);
};
export default routes;