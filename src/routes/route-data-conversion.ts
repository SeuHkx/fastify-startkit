import { FastifyInstance } from 'fastify';
import {
    controllerConvertToDataJsonFormat,
    controllerGetDataJsonFormat,
    controllerExportDataTxt,
    controllerGetConfigList
} from '@/controllers/controller-data-conversion';

/**
 * 数据转换相关路由
 */
export default async function dataConversionRoute(app: FastifyInstance) {
    // 手动触发数据转换
    app.post('/data/convert', controllerConvertToDataJsonFormat);
    
    // 获取转换后的 data.json 格式数据
    app.get('/data/json-format', controllerGetDataJsonFormat);

    // 生成并导出 data.txt
    app.post('/data/export-txt', controllerExportDataTxt);

    // 获取配置文件列表
    app.get('/data/config-list', controllerGetConfigList);
}
