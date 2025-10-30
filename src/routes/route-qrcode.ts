import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { controllerGenerateQRCode, controllerBatchGenerateQRCode, controllerGetSavedQRCodes, controllerDeleteQRCode, controllerDownloadQRCodesByExternalIds } from '@/controllers/controller-qrcode';

/**
 * 二维码相关路由
 */
const qrcodeRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    // 生成单个微信小程序二维码接口
    app.post('/qrcode/generate', controllerGenerateQRCode);
    
    // 批量生成微信小程序二维码并打包下载接口
    app.post('/qrcode/batch-generate', controllerBatchGenerateQRCode);
    
    // 查询已保存的二维码记录接口
    app.get('/qrcode/saved', controllerGetSavedQRCodes);
    
    // 删除已保存的二维码记录接口
    app.delete('/qrcode/delete', controllerDeleteQRCode);
    
    // 通过 externalIds 批量查询并打包下载二维码接口
    app.post('/qrcode/download-by-external-ids', controllerDownloadQRCodesByExternalIds);
};

export default qrcodeRoute;
