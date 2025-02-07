import {FastifyRequest, FastifyReply} from 'fastify';
import serviceFindItems from "@/services/service-findItems";
export async function controllerFindItems(req: FastifyRequest, reply: FastifyReply) {
    const fastify:any =  req.server;
    try {
        const items = await serviceFindItems(fastify,req.body);
        reply.status(200).send({
            message: '查询成功！',
            success:true,
            statusCode:200,
            data:items
        });
    }catch(err){
        reply.send(err);
    }
}
