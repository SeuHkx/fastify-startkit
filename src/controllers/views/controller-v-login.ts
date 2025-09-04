import {FastifyReply, FastifyRequest} from "fastify";

export default async function controllerVLogin(req:FastifyRequest,reply:FastifyReply){
    return reply.view('login/index', { title: '硬件管控终端系统'});
}