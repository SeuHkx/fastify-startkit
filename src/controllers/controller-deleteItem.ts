import {FastifyRequest, FastifyReply} from 'fastify';
import serviceDeleteItem from "@/services/service-deleteItem";
export async function controllerDeleteItem(req: FastifyRequest, reply: FastifyReply) {
    const fastify:any =  req.server;
    const item = await serviceDeleteItem(fastify,req.body);
    reply.status(201).send({
        message: 'delete successfully.',
        success:true,
        statusCode:201,
        data:item
    });
}
