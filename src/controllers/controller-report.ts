import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import controllerReportData from "@/controllers/controller-reportData";
export default async function controllerReport(req:FastifyRequest,reply:FastifyReply){
    const fastify:FastifyInstance =  req.server;
    await controllerReportData(fastify);
    reply.status(200).send({
        success: true,
        statusCode:200,
        message:'上报成功!'
    });
}