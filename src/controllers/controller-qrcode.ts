import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { serviceGenerateUnlimitedQRCode, serviceGenerateBatchQRCodes, serviceGetSavedQRCodes, serviceDeleteQRCode, serviceGetQRCodesByExternalIds, BatchQRCodeItem } from '@/services/service-qrcode';
import archiver from 'archiver';


/**
 * 二维码生成请求体接口
 */
interface QRCodeRequestBody {
    externalId: string; // 外部系统传递的ID
    scene: string;
    page?: string;
    width?: number;
    auto_color?: boolean;
    line_color?: { r: number; g: number; b: number };
    is_hyaline?: boolean;
}

/**
 * 生成微信小程序二维码控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerGenerateQRCode(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;

        // 从配置中获取微信凭证
        const wechatCredentials: any = fastify.config.get('wechat.credentials');
        const appId = wechatCredentials?.appId || process.env.WECHAT_APPID;
        const appSecret = wechatCredentials?.appSecret || process.env.WECHAT_APP_SECRET;

        // 验证配置
        if (!appId || !appSecret) {
            return reply.status(500).send({
                success: false,
                message: '微信小程序配置缺失，请检查配置文件或环境变量',
                statusCode: 500,
            });
        }

        // 获取请求参数
        const body = req.body as QRCodeRequestBody;

        // 验证必填参数
        if (!body.externalId) {
            return reply.status(400).send({
                success: false,
                message: 'externalId 参数不能为空',
                statusCode: 400,
            });
        }

        if (!body.scene) {
            return reply.status(400).send({
                success: false,
                message: 'scene 参数不能为空',
                statusCode: 400,
            });
        }

        // 调用服务层生成二维码 (包含数据库保存)
        const result = await serviceGenerateUnlimitedQRCode(
            fastify,
            {
                appId,
                appSecret,
            },
            {
                externalId: body.externalId,
                scene: body.scene,
                page: body.page,
                width: body.width,
                auto_color: body.auto_color,
                line_color: body.line_color,
                is_hyaline: body.is_hyaline,
            }
        );

        // 返回标准化 JSON 响应
        return reply.status(result.statusCode).send(result);

    } catch (error) {
        console.error('生成二维码控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '生成二维码时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 批量二维码生成请求体接口
 */
interface BatchQRCodeRequestBody {
    items: BatchQRCodeItem[];
    page?: string; // 公共页面路径
    width?: number; // 公共宽度
    auto_color?: boolean;
    line_color?: { r: number; g: number; b: number };
    is_hyaline?: boolean;
}

/**
 * 批量生成微信小程序二维码并打包下载控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerBatchGenerateQRCode(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        // 从配置中获取微信凭证
        const wechatCredentials: any = fastify.config.get('wechat.credentials');
        const appId = wechatCredentials?.appId || process.env.WECHAT_APPID;
        const appSecret = wechatCredentials?.appSecret || process.env.WECHAT_APP_SECRET;

        // 验证配置
        if (!appId || !appSecret) {
            return reply.status(500).send({
                success: false,
                message: '微信小程序配置缺失，请检查配置文件或环境变量',
                statusCode: 500,
            });
        }

        // 获取请求参数
        const body = req.body as BatchQRCodeRequestBody;

        if (!body.items || body.items.length === 0) {
            return reply.status(400).send({
                success: false,
                message: '批量生成列表不能为空',
                statusCode: 400,
            });
        }

        // 处理公共参数：如果 item 没有指定 page，使用公共 page
        const items = body.items.map(item => ({
            ...item,
            page: item.page || body.page,
        }));

        // 调用服务层批量生成二维码
        const result = await serviceGenerateBatchQRCodes(
            fastify,
            {
                appId,
                appSecret,
            },
            items,
            {
                width: body.width,
                auto_color: body.auto_color,
                line_color: body.line_color,
                is_hyaline: body.is_hyaline,
            }
        );

        // 如果生成失败
        if (!result.success) {
            return reply.status(result.statusCode).send({
                success: false,
                message: result.message,
                statusCode: result.statusCode,
            });
        }

        // 创建 ZIP 压缩包
        const archive = archiver('zip', {
            zlib: { level: 9 } // 最高压缩级别
        });

        // 错误处理
        archive.on('error', (err) => {
            fastify.log.error(`压缩文件时发生错误: ${err.message}`);
            throw err;
        });

        // 监听警告
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                fastify.log.warn(`压缩警告: ${err.message}`);
            } else {
                throw err;
            }
        });

        // 添加成功生成的二维码到压缩包
        let addedCount = 0;
        for (const item of result.results) {
            if (item.success && item.data) {
                archive.append(item.data, { name: item.filename });
                addedCount++;
            }
        }

        // 添加一个结果摘要文件
        const summary = {
            total: result.results.length,
            success: result.results.filter(r => r.success).length,
            failed: result.results.filter(r => !r.success).length,
            details: result.results.map(r => ({
                scene: r.scene,
                filename: r.filename,
                success: r.success,
                error: r.error,
            })),
            generatedAt: new Date().toISOString(),
        };
        archive.append(JSON.stringify(summary, null, 2), { name: 'summary.json' });

        // 完成压缩
        await archive.finalize();

        fastify.log.info(`批量生成完成：成功添加 ${addedCount} 个二维码到压缩包`);

        // 设置响应头（包含 CORS 头）
        const origin = req.headers.origin || '*';
        reply.header('Content-Type', 'application/zip');
        reply.header('Content-Disposition', `attachment; filename="qrcodes-batch-${Date.now()}.zip"`);
        reply.header('Cache-Control', 'no-cache');
        reply.header('Access-Control-Allow-Origin', origin);
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        reply.header('Access-Control-Allow-Credentials', 'true');
        reply.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type');

        // 发送响应
        reply.code(200);
        return reply.send(archive);

    } catch (error) {
        console.error('批量生成二维码控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '批量生成二维码时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 查询已保存的二维码记录控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerGetSavedQRCodes(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        // 获取查询参数
        const query = req.query as {
            externalId?: string;
            scene?: string;
            id?: string;
            limit?: string;
            offset?: string;
        };

        // 构建过滤条件
        const filters: {
            externalId?: string;
            scene?: string;
            id?: number;
            limit?: number;
            offset?: number;
        } = {};

        if (query.externalId) {
            filters.externalId = query.externalId;
        }
        if (query.scene) {
            filters.scene = query.scene;
        }
        if (query.id) {
            const id = parseInt(query.id);
            if (!isNaN(id)) {
                filters.id = id;
            }
        }
        if (query.limit) {
            const limit = parseInt(query.limit);
            if (!isNaN(limit) && limit > 0 && limit <= 100) {
                filters.limit = limit;
            }
        }
        if (query.offset) {
            const offset = parseInt(query.offset);
            if (!isNaN(offset) && offset >= 0) {
                filters.offset = offset;
            }
        }

        // 调用服务层查询二维码
        const result = await serviceGetSavedQRCodes(fastify, filters);

        // 返回标准化 JSON 响应
        return reply.status(result.statusCode).send(result);

    } catch (error) {
        console.error('查询已保存二维码控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '查询二维码时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 删除已保存的二维码记录控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerDeleteQRCode(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        // 获取查询参数
        const query = req.query as {
            externalId?: string;
            id?: string;
        };

        // 验证参数
        if (!query.id && !query.externalId) {
            return reply.status(400).send({
                success: false,
                message: '必须提供 id 或 externalId 参数',
                statusCode: 400,
            });
        }

        // 构建删除条件
        const filters: {
            externalId?: string;
            id?: number;
        } = {};

        if (query.id) {
            const id = parseInt(query.id);
            if (isNaN(id)) {
                return reply.status(400).send({
                    success: false,
                    message: 'id 参数必须是数字',
                    statusCode: 400,
                });
            }
            filters.id = id;
        }

        if (query.externalId) {
            filters.externalId = query.externalId;
        }

        // 调用服务层删除二维码
        const result = await serviceDeleteQRCode(fastify, filters);

        // 返回标准化 JSON 响应
        return reply.status(result.statusCode).send(result);

    } catch (error) {
        console.error('删除二维码控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '删除二维码时发生未知错误',
            statusCode: 500,
        });
    }
}

/**
 * 批量下载请求体接口
 */
interface DownloadByExternalIdsRequestBody {
    externalIds: string[];
}

/**
 * 通过 externalIds 批量查询并打包下载二维码控制器
 * @param req 请求对象
 * @param reply 响应对象
 */
export async function controllerDownloadQRCodesByExternalIds(req: FastifyRequest, reply: FastifyReply) {
    try {
        const fastify: FastifyInstance = req.server;
        // 获取请求体
        const body = req.body as DownloadByExternalIdsRequestBody;

        // 验证参数
        if (!body.externalIds || !Array.isArray(body.externalIds) || body.externalIds.length === 0) {
            return reply.status(400).send({
                success: false,
                message: 'externalIds 参数必须是非空数组',
                statusCode: 400,
            });
        }

        // 调用服务层批量查询二维码
        const result = await serviceGetQRCodesByExternalIds(fastify, body.externalIds);

        // 如果没有查询到任何二维码
        if (!result.success || result.results.filter(r => r.success).length === 0) {
            return reply.status(404).send({
                success: false,
                message: '未找到任何二维码记录',
                statusCode: 404,
            });
        }

        // 创建 ZIP 压缩包
        const archive = archiver('zip', {
            zlib: { level: 9 } // 最高压缩级别
        });

        // 错误处理
        archive.on('error', (err) => {
            fastify.log.error(`压缩文件时发生错误: ${err.message}`);
            throw err;
        });

        // 监听警告
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                fastify.log.warn(`压缩警告: ${err.message}`);
            } else {
                throw err;
            }
        });

        // 添加成功查询到的二维码到压缩包
        let addedCount = 0;
        for (const item of result.results) {
            if (item.success && item.data) {
                // 生成文件名：externalId_scene_id.png
                const filename = `${item.externalId}_${item.data.scene}_${item.data.id}.png`;
                archive.append(item.data.qrcodeBuffer, { name: filename });
                addedCount++;
            }
        }

        // 添加一个结果摘要文件
        const summary = {
            total: result.results.length,
            success: result.results.filter(r => r.success).length,
            failed: result.results.filter(r => !r.success).length,
            details: result.results.map(r => ({
                externalId: r.externalId,
                success: r.success,
                error: r.error,
                id: r.data?.id,
                scene: r.data?.scene,
            })),
            downloadedAt: new Date().toISOString(),
        };
        archive.append(JSON.stringify(summary, null, 2), { name: 'summary.json' });

        // 完成压缩
        await archive.finalize();

        fastify.log.info(`批量下载完成：成功添加 ${addedCount} 个二维码到压缩包`);

        // 设置响应头（包含 CORS 头）
        const origin = req.headers.origin || '*';
        reply.header('Content-Type', 'application/zip');
        reply.header('Content-Disposition', `attachment; filename="qrcodes-${Date.now()}.zip"`);
        reply.header('Cache-Control', 'no-cache');
        reply.header('Access-Control-Allow-Origin', origin);
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        reply.header('Access-Control-Allow-Credentials', 'true');
        reply.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type');

        // 发送响应
        reply.code(200);
        return reply.send(archive);

    } catch (error) {
        console.error('批量下载二维码控制器错误:', error);

        return reply.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : '批量下载二维码时发生未知错误',
            statusCode: 500,
        });
    }
}
