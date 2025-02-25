import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";

export default async function controllerVMain(req:FastifyRequest,reply:FastifyReply){
    const fastify:FastifyInstance = req.server;
    let tabsData = [
        {
            name:'上传数据'
        },
        {
            name:'待处理数据'
        },
        {
            name:'已完成'
        }
    ]
    const token:any = req.cookies.token;
    const user:any = fastify.jwt.verify(token);
    return reply.view('main/index', {
        title: '数据上报',
        data:{
            tabsData: tabsData,
            username:user.name
        }
    });
}