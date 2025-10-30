import { FastifyPluginAsync } from 'fastify';

// 静态导入所有路由 - 兼容 webpack 打包
import loginRoute from '@/routes/route-login';
import passwordRoute from '@/routes/route-password';
import networkRoute from '@/routes/route-network';
import devicesRoute from '@/routes/route-devices';
import deviceInstancesRoute from '@/routes/route-device-instances';
import deviceManagementRoute from '@/routes/route-device-management';
import dataConversionRoute from '@/routes/route-data-conversion';
import dataTxtParserRoute from '@/routes/route-data-txt-parser';
import qrcodeRoute from '@/routes/route-qrcode';
import loginVRoute from '@/routes/views/route-v-login';
import mainVRoute from '@/routes/views/route-v-main';

/**
 * 路由配置列表
 * 添加新路由时：
 * 1. 在上方导入：import newRoute from '@/routes/route-new';
 * 2. 在下方数组添加：[newRoute, 'route-name'],
 */
const routeModules: Array<[FastifyPluginAsync, string]> = [
    // API 路由
    [loginRoute, 'login'],
    [passwordRoute, 'password'],
    [networkRoute, 'network'],
    [devicesRoute, 'devices'],
    [deviceInstancesRoute, 'device-instances'],
    [deviceManagementRoute, 'device-management'],
    [dataConversionRoute, 'data-conversion'],
    [dataTxtParserRoute, 'data-txt-parser'],
    [qrcodeRoute, 'qrcode'],
    
    // 视图路由
    [loginVRoute, 'view:login'],
    [mainVRoute, 'view:main'],
];

/**
 * 自动注册路由
 * 遍历路由配置列表并注册到 Fastify 实例
 */
const routes: FastifyPluginAsync = async (app) => {
    for (const [routePlugin, routeName] of routeModules) {
        try {
            if (routePlugin && typeof routePlugin === 'function') {
                app.register(routePlugin);
                app.log.info(`✓ 已加载路由: ${routeName}`);
            } else {
                app.log.warn(`⚠ 路由模块无效: ${routeName}`);
            }
        } catch (error) {
            app.log.error(`✗ 加载路由失败 ${routeName}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};

export default routes;