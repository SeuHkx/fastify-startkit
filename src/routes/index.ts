import { FastifyPluginAsync } from 'fastify';
import loginRoute from "@/routes/route-login";
import passwordRoute from "@/routes/route-password";
import networkRoute from "@/routes/route-network";
import devicesRoute from "@/routes/route-devices";
import deviceInstancesRoute from "@/routes/route-device-instances";
import dataConversionRoute from "@/routes/route-data-conversion";
import dataTxtParserRoute from "@/routes/route-data-txt-parser";
import { controllerGetEnhancedDeviceList } from "@/controllers/controller-device-management";
import loginVRoute from "@/routes/views/route-v-login";
import mainVRoute from "@/routes/views/route-v-main";


const routes: FastifyPluginAsync = async (app) => {
    app.register(loginRoute);
    app.register(passwordRoute);
    app.register(networkRoute);
    app.register(devicesRoute);
    app.register(deviceInstancesRoute);
    app.register(dataConversionRoute);
    app.register(dataTxtParserRoute);
    app.register(loginVRoute);
    app.register(mainVRoute);
    
    // Enhanced device management route
    app.get('/device-management', controllerGetEnhancedDeviceList);
};
export default routes;