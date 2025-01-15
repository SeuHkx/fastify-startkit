import type {FastifyPluginAsync, FastifyPluginOptions} from "fastify";

const errorHandlerPlugin:FastifyPluginAsync<FastifyPluginOptions> = async (fastify)=>{
    fastify.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            message: `Route ${request.method}:${request.url} not found`,
            error: "Not Found",
            statusCode: 404,
            success:false
        });
    });
    fastify.setErrorHandler((error:any, request, reply) => {
        const statusCode = error.statusCode || 500;
        //根据状态码提供详细的错误信息
        let message;
        switch (statusCode) {
            case 400:
                message = 'Bad Request: The server could not understand the request.';
                break;
            case 401:
                message = 'Unauthorized: Access is denied due to invalid credentials.';
                break;
            case 403:
                message = 'Forbidden: You do not have permission to access this resource.';
                break;
            case 404:
                message = 'Not Found: The requested resource could not be found.';
                break;
            case 500:
                message = 'Internal Server Error: An unexpected error occurred.';
                break;
            default:
                message = error.message || 'An unexpected error occurred.';
        }
        reply.status(statusCode).send({
            message: message,
            error: error.name || 'Error',
            statusCode: statusCode,
            details: (error as any).details || null,
            success: false,
        });
    });
}

export default errorHandlerPlugin;