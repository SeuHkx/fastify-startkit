import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";

export default async function controllerVMain(req:FastifyRequest,reply:FastifyReply){
    const fastify:FastifyInstance = req.server;
    const token:any = req.cookies.token;
    const user:any = fastify.jwt.verify(token);
    
    // 获取sidebar配置
    const sidebarConfig = {
        title: fastify.config.get('sidebar.title'),
        menu: fastify.config.get('sidebar.menu')
    };
    return reply.view('main/index', {
        title: '硬件管控终端系统平台',
        data:{
            username: user.name,
            sidebar: sidebarConfig
        }
    });
}