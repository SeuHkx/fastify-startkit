import {FastifyRequest, FastifyReply} from 'fastify';
import serviceAddItem from "@/services/service-addItem";
export async function controllerAddItem(req: FastifyRequest, reply: FastifyReply) {
    const fastify:any =  req.server;
    const item = await serviceAddItem(fastify,req.body);
    reply.status(201).send({
        message: 'add successfully.',
        success:true,
        statusCode:201,
        data:item
    });
}
