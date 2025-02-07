import {FastifyRequest, FastifyReply,FastifyInstance} from 'fastify';
import serviceLogin from "@/services/service-login";
export async function controllerLogin(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify:FastifyInstance =  req.server;
        const user:any = await serviceLogin(fastify,req.body as { name: string; password: string });
        const resData:any = {
            success:user.success,
            statusCode:user.statusCode,
            message:user.message
        }
        if(user.success){
            resData.token = user.data.token;
        }
        reply.status(200).send(resData);
    }catch (error) {
        reply.send(error);
    }

}