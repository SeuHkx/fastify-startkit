import { FastifyInstance } from 'fastify';
import { controllerParseDataTxtToJson } from '@/controllers/controller-data-txt-parser';

/**
 * data.txt 解析相关路由
 */
export default async function dataTxtParserRoute(app: FastifyInstance) {
    // 解析 data.txt 文件
    app.post('/data/parse-txt', controllerParseDataTxtToJson);
}
