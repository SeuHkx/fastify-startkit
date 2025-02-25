import {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import serviceLogin from "@/services/service-login";

export async function controllerLogin(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify:FastifyInstance = req.server;
        const user:any = await serviceLogin(fastify,req.body as { name: string; password: string });
        const resData:any = {
            success:user.success,
            statusCode:user.statusCode,
            message:user.message
        }
        if(user.success){
            const token = await reply.jwtSign({
                userId: user.data.id,
                name: user.data.name,
                role:'admin'
            });
            return reply.setCookie('token',token,{
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: true
            }).redirect('/main');
        }else{
            reply.status(200).send(resData);
        }
    }catch (error) {
        reply.send(error);
    }
}