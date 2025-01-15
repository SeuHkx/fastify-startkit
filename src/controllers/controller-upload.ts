import {FastifyRequest, FastifyReply} from 'fastify';

export async function uploadController(req: FastifyRequest, reply: FastifyReply) {
    const fastify:any =  req.server;
    const database = fastify.config.get('database');
    const items = await fastify.prisma.application.findMany();
    reply.send({
        message: 'uploaded successfully.' ,
        item:JSON.stringify(items[9]),
        config:JSON.stringify(database),
        env:JSON.stringify(fastify.env.NODE_ENV)
    });
}
