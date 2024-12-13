import {FastifyRequest, FastifyReply} from 'fastify';

export async function uploadController(req: FastifyRequest, reply: FastifyReply) {
    const fastify:any =  req.server;
    const database = fastify.config.get('database')
    reply.send({ message: 'uploaded successfully.' ,config:JSON.stringify(database),env:JSON.stringify(fastify.env.NODE_ENV) });
}
