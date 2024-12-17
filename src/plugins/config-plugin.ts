import { FastifyPluginAsync,FastifyPluginOptions} from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import config from 'config';

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            get: (key: string) => string | null;
            has: (key: string) => boolean;
        }
    }
}
const configPlugin: FastifyPluginAsync<FastifyPluginOptions> = async (fastify) => {
    fastify.decorate('config', {
        get: (key:string) => {
            if (!config.has(key)) {
                fastify.log.warn(`This is key: ${key} environment variables not configured`);
                return null;
            }
            return config.get(key);
        },
        has: (key:string) => config.has(key)
    });
}
export default fastifyPlugin(configPlugin);