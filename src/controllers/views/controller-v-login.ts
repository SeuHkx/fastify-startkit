import {FastifyReply, FastifyRequest} from "fastify";

export default async function controllerVLogin(req:FastifyRequest,reply:FastifyReply){
    return reply.view('login/index', { title: '数据上报'});
}