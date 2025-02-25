import type {FastifyInstance,FastifyRequest,FastifyReply,FastifyPluginAsync, FastifyPluginOptions} from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import axios from 'axios';

declare module 'fastify' {
    interface FastifyInstance {
        axios: any
    }
}

const axiosPlugin:FastifyPluginAsync<FastifyPluginOptions> = async (fastifyInstance: FastifyInstance, options: FastifyPluginOptions) => {
    const axiosInstance = axios.create({
        baseURL: options.baseURL || '', // 可选的基础 URL
        timeout: options.timeout || 20000, // 可选的超时时间
    });
    fastifyInstance.decorate('axios', axiosInstance);
}

export default fastifyPlugin(axiosPlugin)