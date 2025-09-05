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
                secure: false,
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

export async function controllerLogout(req: FastifyRequest, reply: FastifyReply) {
    try {
        // 清除cookie中的token
        reply.clearCookie('token', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        return reply.status(200).send({
            success: true,
            message: '退出成功'
        });
    } catch (error) {
        return reply.status(500).send({
            success: false,
            message: '退出失败'
        });
    }
}
