import type {FastifyInstance,FastifyPluginAsync, FastifyPluginOptions} from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

declare module 'fastify' {
    interface FastifyInstance {
        env: { [key: string]: string | undefined };
    }
}

const envPlugin: FastifyPluginAsync<FastifyPluginOptions> = async (fastify)=>{
    const environment:any = process.env.NODE_ENV;
    const myEnv = dotenv.config({
        path: `.env.${environment}`
    });
    dotenvExpand.expand(myEnv);
    fastify.decorate('env', process.env);
}
export default fastifyPlugin(envPlugin);

