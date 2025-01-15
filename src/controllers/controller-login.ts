import {FastifyRequest, FastifyReply,FastifyInstance} from 'fastify';

export async function controllerLogin(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify:FastifyInstance =  req.server;
        const { username, password } = req.body as { username: string; password: string };
        if (username === 'admin' && password === 'admin') {
            const token = fastify.jwt.sign({ username });
            return reply.send({ token });
        }
        return reply.status(401).send({
            message: 'Invalid username or password' ,
            success: false,
            statusCode: 401
        });
    }catch (error) {
        reply.send(error);
    }

}