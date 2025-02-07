import {FastifyRequest, FastifyReply} from 'fastify';
import serviceUpdateItem from "@/services/service-updateItem";
export async function controllerUpdateItem(req: FastifyRequest, reply: FastifyReply) {
    const fastify:any =  req.server;
    const item = await serviceUpdateItem(fastify,req.body);
    reply.status(200).send({
        message: '修改成功！',
        success:true,
        statusCode:200,
        data:item
    });
}
