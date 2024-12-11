import { FastifyRequest, FastifyReply } from 'fastify';

export async function uploadController(req: FastifyRequest, reply: FastifyReply) {
    const file = await req.file();
    reply.send({ message: 'File uploaded successfully.' });
}
