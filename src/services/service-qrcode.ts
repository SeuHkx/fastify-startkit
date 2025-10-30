import { FastifyInstance } from 'fastify';

/**
 * 微信小程序配置接口
 */
interface WxConfig {
    appId: string;
    appSecret: string;
}

/**
 * 微信 access_token 响应接口
 */
interface WxAccessTokenResponse {
    access_token?: string;
    expires_in?: number;
    errcode?: number;
    errmsg?: string;
}

/**
 * 二维码生成参数接口
 */
interface QRCodeParams {
    externalId: string; // 外部系统ID
    scene: string;
    page?: string;
    width?: number;
    env_version?:string;
    auto_color?: boolean;
    line_color?: { r: number; g: number; b: number };
    is_hyaline?: boolean;
}

/**
 * 二维码生成结果接口
 */
export interface QRCodeGenerateResult {
    success: boolean;
    statusCode: number;
    message: string;
    data?: {
        id: number;
        externalId: string;
        scene: string;
        page: string | null;
        width: number;
        qrcodeBase64: string; // 二维码图片 base64 编码
        createdAt: Date;
    };
}

/**
 * 缓存 access_token
 */
let accessTokenCache: { token: string; expiresAt: number } | null = null;

/**
 * 获取微信 access_token
 * @param fastify Fastify 实例
 * @param wxConfig 微信小程序配置
 */
async function getAccessToken(fastify: FastifyInstance, wxConfig: WxConfig): Promise<{ success: boolean; token?: string; message?: string }> {
    try {
        // 检查缓存是否有效
        // if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
        //     return { success: true, token: accessTokenCache.token };
        // }

        // 从配置中获取微信 API 地址
        const wechatConfig: any = fastify.config.get('wechat.api');
        const baseUrl = wechatConfig?.baseUrl || 'https://api.weixin.qq.com';
        const tokenPath = wechatConfig?.tokenUrl || '/cgi-bin/token';
        
        // 调用微信接口获取 access_token
        const url = `${baseUrl}${tokenPath}?grant_type=client_credential&appid=${wxConfig.appId}&secret=${wxConfig.appSecret}`;
        
        const response = await fastify.axios.get(url);
        
        if (response.data.access_token) {
            // 缓存 token，提前 5 分钟过期以避免边界问题
            accessTokenCache = {
                token: response.data.access_token,
                expiresAt: Date.now() + (response.data.expires_in! - 300) * 1000,
            };
            
            return { success: true, token: response.data.access_token };
        } else {
            return { 
                success: false, 
                message: `获取 access_token 失败: ${response.data.errmsg || '未知错误'}` 
            };
        }
    } catch (error) {
        console.error('获取微信 access_token 失败:', error);
        return { 
            success: false, 
            message: error instanceof Error ? error.message : '获取 access_token 时发生未知错误' 
        };
    }
}

/**
 * 生成微信小程序无限量二维码并保存到数据库
 * @param fastify Fastify 实例
 * @param wxConfig 微信小程序配置
 * @param params 二维码参数
 */
export async function serviceGenerateUnlimitedQRCode(
    fastify: FastifyInstance,
    wxConfig: WxConfig,
    params: QRCodeParams
): Promise<QRCodeGenerateResult> {
    try {
        // 参数验证
        if (!wxConfig.appId || !wxConfig.appSecret) {
            return {
                success: false,
                statusCode: 400,
                message: '微信小程序配置缺失',
            };
        }

        if (!params.externalId) {
            return {
                success: false,
                statusCode: 400,
                message: 'externalId 参数不能为空',
            };
        }

        if (!params.scene) {
            return {
                success: false,
                statusCode: 400,
                message: 'scene 参数不能为空',
            };
        }

        // 获取 access_token
        const tokenResult = await getAccessToken(fastify, wxConfig);
        if (!tokenResult.success || !tokenResult.token) {
            return {
                success: false,
                statusCode: 500,
                message: tokenResult.message || '获取 access_token 失败',
            };
        }

        // 从配置中获取微信 API 地址
        const wechatConfig: any = fastify.config.get('wechat.api');
        const baseUrl = wechatConfig?.baseUrl || 'https://api.weixin.qq.com';
        const qrcodePath = wechatConfig?.qrcodeUrl || '/wxa/getwxacodeunlimit';
        
        // 调用微信接口生成二维码
        const url = `${baseUrl}${qrcodePath}?access_token=${tokenResult.token}`;
        
        const requestBody = {
            scene: params.scene,
            page: params.page,
            width: params.width || 430,
            check_path:true,
            env_version:'develop',
            auto_color: params.auto_color !== undefined ? params.auto_color : false,
            line_color: params.line_color,
            is_hyaline: params.is_hyaline !== undefined ? params.is_hyaline : true,
        };

        const response = await fastify.axios.post(url, requestBody, {
            responseType: 'arraybuffer',
        });

        // 检查响应是否为错误信息（JSON格式）
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
            const errorData = JSON.parse(Buffer.from(response.data).toString('utf-8'));
            return {
                success: false,
                statusCode: 500,
                message: `生成二维码失败: ${errorData.errmsg || '未知错误'}`,
            };
        }

        // 获取二维码图片数据
        const qrcodeBuffer = Buffer.from(response.data);

        // 保存二维码记录到数据库
        let dbRecord;
        try {
            dbRecord = await fastify.prisma.qrcodeRecord.create({
                data: {
                    externalId: params.externalId,
                    scene: params.scene,
                    page: params.page || null,
                    width: params.width || 430,
                    qrcodeData: qrcodeBuffer,
                },
            });
            fastify.log.info(`二维码记录已保存: id=${dbRecord.id}, externalId=${params.externalId}, scene=${params.scene}`);
        } catch (dbError: any) {
            fastify.log.error('保存二维码记录到数据库失败:', dbError?.message || dbError);
            // 数据库保存失败,但二维码已生成,继续返回
            return {
                success: false,
                statusCode: 500,
                message: `二维码生成成功,但保存到数据库失败: ${dbError?.message || '未知错误'}`,
            };
        }

        // 返回标准化响应
        return {
            success: true,
            statusCode: 200,
            message: '二维码生成成功',
            data: {
                id: dbRecord.id,
                externalId: dbRecord.externalId,
                scene: dbRecord.scene,
                page: dbRecord.page,
                width: dbRecord.width,
                qrcodeBase64: qrcodeBuffer.toString('base64'),
                createdAt: dbRecord.createdAt,
            },
        };

    } catch (error) {
        console.error('生成微信小程序二维码失败:', error);
        return {
            success: false,
            statusCode: 500,
            message: error instanceof Error ? error.message : '生成二维码时发生未知错误',
        };
    }
}

/**
 * 清除 access_token 缓存（用于测试或重置）
 */
export function clearAccessTokenCache(): void {
    accessTokenCache = null;
}

/**
 * 批量生成二维码参数接口
 */
export interface BatchQRCodeItem {
    scene: string;
    page?: string;
    filename?: string; // 自定义文件名，如果不提供则使用 scene 作为文件名
}

/**
 * 批量生成结果接口
 */
export interface BatchQRCodeResult {
    scene: string;
    filename: string;
    success: boolean;
    data?: Buffer;
    error?: string;
}

/**
 * 二维码记录接口
 */
interface QRCodeRecordData {
    id: number;
    externalId: string;
    scene: string;
    page: string | null;
    width: number;
    qrcodeBase64: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 查询已保存的二维码记录
 * @param fastify Fastify 实例
 * @param filters 查询过滤条件
 */
export async function serviceGetSavedQRCodes(
    fastify: FastifyInstance,
    filters?: {
        externalId?: string;
        scene?: string;
        id?: number;
        limit?: number;
        offset?: number;
    }
): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: QRCodeRecordData | {
        records: QRCodeRecordData[];
        total: number;
    };
}> {
    try {
        // 如果是按 ID 查询，直接返回单个对象
        if (filters?.id) {
            const record = await fastify.prisma.qrcodeRecord.findUnique({
                where: {
                    id: filters.id,
                },
            });

            if (!record) {
                return {
                    success: false,
                    statusCode: 404,
                    message: '未找到该二维码记录',
                };
            }

            return {
                success: true,
                statusCode: 200,
                message: '查询成功',
                data: {
                    id: record.id,
                    externalId: record.externalId,
                    scene: record.scene,
                    page: record.page,
                    width: record.width,
                    qrcodeBase64: record.qrcodeData ? Buffer.from(record.qrcodeData).toString('base64') : '',
                    createdAt: record.createdAt,
                    updatedAt: record.updatedAt,
                },
            };
        }

        // 如果是按 externalId 查询，返回单个对象（最新的一条记录）
        if (filters?.externalId) {
            const record = await fastify.prisma.qrcodeRecord.findFirst({
                where: {
                    externalId: filters.externalId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            if (!record) {
                return {
                    success: false,
                    statusCode: 404,
                    message: '未找到该二维码记录',
                };
            }

            return {
                success: true,
                statusCode: 200,
                message: '查询成功',
                data: {
                    id: record.id,
                    externalId: record.externalId,
                    scene: record.scene,
                    page: record.page,
                    width: record.width,
                    qrcodeBase64: record.qrcodeData ? Buffer.from(record.qrcodeData).toString('base64') : '',
                    createdAt: record.createdAt,
                    updatedAt: record.updatedAt,
                },
            };
        }

        // 构建查询条件（列表查询）
        const where: any = {};
        if (filters?.scene) {
            where.scene = filters.scene;
        }

        // 查询总数
        const total = await fastify.prisma.qrcodeRecord.count({ where });

        // 查询记录
        const records = await fastify.prisma.qrcodeRecord.findMany({
            where,
            take: filters?.limit || 10,
            skip: filters?.offset || 0,
            orderBy: {
                createdAt: 'desc',
            },
        });

        // 转换数据格式
        const formattedRecords = records.map(record => ({
            id: record.id,
            externalId: record.externalId,
            scene: record.scene,
            page: record.page,
            width: record.width,
            qrcodeBase64: record.qrcodeData ? Buffer.from(record.qrcodeData).toString('base64') : '',
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        }));

        return {
            success: true,
            statusCode: 200,
            message: '查询成功',
            data: {
                records: formattedRecords,
                total,
            },
        };
    } catch (error) {
        console.error('查询已保存的二维码记录失败:', error);
        return {
            success: false,
            statusCode: 500,
            message: error instanceof Error ? error.message : '查询二维码记录时发生未知错误',
        };
    }
}

/**
 * 删除已保存的二维码记录
 * @param fastify Fastify 实例
 * @param filters 删除条件
 */
export async function serviceDeleteQRCode(
    fastify: FastifyInstance,
    filters: {
        externalId?: string;
        id?: number;
    }
): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: {
        deletedCount: number;
    };
}> {
    try {
        // 必须提供 id 或 externalId
        if (!filters.id && !filters.externalId) {
            return {
                success: false,
                statusCode: 400,
                message: '必须提供 id 或 externalId',
            };
        }

        // 如果是按 ID 删除
        if (filters.id) {
            // 先检查记录是否存在
            const record = await fastify.prisma.qrcodeRecord.findUnique({
                where: {
                    id: filters.id,
                },
            });

            if (!record) {
                return {
                    success: false,
                    statusCode: 404,
                    message: '未找到该二维码记录',
                };
            }

            // 删除记录
            await fastify.prisma.qrcodeRecord.delete({
                where: {
                    id: filters.id,
                },
            });

            fastify.log.info(`二维码记录已删除: id=${filters.id}`);

            return {
                success: true,
                statusCode: 200,
                message: '删除成功',
                data: {
                    deletedCount: 1,
                },
            };
        }

        // 如果是按 externalId 删除（删除所有匹配的记录）
        if (filters.externalId) {
            // 先检查记录是否存在
            const count = await fastify.prisma.qrcodeRecord.count({
                where: {
                    externalId: filters.externalId,
                },
            });

            if (count === 0) {
                return {
                    success: false,
                    statusCode: 404,
                    message: '未找到该二维码记录',
                };
            }

            // 删除所有匹配的记录
            const result = await fastify.prisma.qrcodeRecord.deleteMany({
                where: {
                    externalId: filters.externalId,
                },
            });

            fastify.log.info(`二维码记录已删除: externalId=${filters.externalId}, 删除数量=${result.count}`);

            return {
                success: true,
                statusCode: 200,
                message: '删除成功',
                data: {
                    deletedCount: result.count,
                },
            };
        }

        return {
            success: false,
            statusCode: 400,
            message: '删除参数错误',
        };
    } catch (error) {
        console.error('删除二维码记录失败:', error);
        return {
            success: false,
            statusCode: 500,
            message: error instanceof Error ? error.message : '删除二维码记录时发生未知错误',
        };
    }
}

/**
 * 批量生成微信小程序无限量二维码
 * @param fastify Fastify 实例
 * @param wxConfig 微信小程序配置
 * @param items 批量二维码参数列表
 * @param commonParams 公共参数（宽度、颜色等）
 */
export async function serviceGenerateBatchQRCodes(
    fastify: FastifyInstance,
    wxConfig: WxConfig,
    items: BatchQRCodeItem[],
    commonParams?: {
        width?: number;
        env_version?: string;
        auto_color?: boolean;
        line_color?: { r: number; g: number; b: number };
        is_hyaline?: boolean;
    }
): Promise<{ success: boolean; results: BatchQRCodeResult[]; statusCode: number; message: string }> {
    try {
        // 参数验证
        if (!wxConfig.appId || !wxConfig.appSecret) {
            return {
                success: false,
                statusCode: 400,
                message: '微信小程序配置缺失',
                results: [],
            };
        }

        if (!items || items.length === 0) {
            return {
                success: false,
                statusCode: 400,
                message: '批量生成列表不能为空',
                results: [],
            };
        }

        // 验证每个 item 的 scene
        for (const item of items) {
            if (!item.scene) {
                return {
                    success: false,
                    statusCode: 400,
                    message: '批量列表中存在空的 scene 参数',
                    results: [],
                };
            }
        }

        // 获取 access_token
        const tokenResult = await getAccessToken(fastify, wxConfig);
        if (!tokenResult.success || !tokenResult.token) {
            return {
                success: false,
                statusCode: 500,
                message: tokenResult.message || '获取 access_token 失败',
                results: [],
            };
        }

        // 从配置中获取微信 API 地址
        const wechatConfig: any = fastify.config.get('wechat.api');
        const baseUrl = wechatConfig?.baseUrl || 'https://api.weixin.qq.com';
        const qrcodePath = wechatConfig?.qrcodeUrl || '/wxa/getwxacodeunlimit';
        
        const url = `${baseUrl}${qrcodePath}?access_token=${tokenResult.token}`;
        const results: BatchQRCodeResult[] = [];

        // 批量生成二维码
        for (const item of items) {
            try {
                const requestBody = {
                    scene: item.scene,
                    page: item.page,
                    width: commonParams?.width || 430,
                    env_version: commonParams?.env_version || 'trial',
                    auto_color: commonParams?.auto_color !== undefined ? commonParams.auto_color : false,
                    line_color: commonParams?.line_color,
                    is_hyaline: commonParams?.is_hyaline !== undefined ? commonParams.is_hyaline : true,
                };

                const response = await fastify.axios.post(url, requestBody, {
                    responseType: 'arraybuffer',
                });

                // 检查响应是否为错误信息（JSON格式）
                const contentType = response.headers['content-type'];
                if (contentType && contentType.includes('application/json')) {
                    const errorData = JSON.parse(Buffer.from(response.data).toString('utf-8'));
                    results.push({
                        scene: item.scene,
                        filename: item.filename || `qrcode-${item.scene}.png`,
                        success: false,
                        error: errorData.errmsg || '未知错误',
                    });
                } else {
                    results.push({
                        scene: item.scene,
                        filename: item.filename || `qrcode-${item.scene}.png`,
                        success: true,
                        data: Buffer.from(response.data),
                    });
                }

                // 添加延迟避免请求过于频繁（微信有调用频率限制）
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`生成二维码失败 (scene: ${item.scene}):`, error);
                results.push({
                    scene: item.scene,
                    filename: item.filename || `qrcode-${item.scene}.png`,
                    success: false,
                    error: error instanceof Error ? error.message : '生成失败',
                });
            }
        }

        // 检查是否有成功的结果
        const successCount = results.filter(r => r.success).length;
        
        return {
            success: successCount > 0,
            statusCode: 200,
            message: `批量生成完成：成功 ${successCount}/${items.length}`,
            results,
        };

    } catch (error) {
        console.error('批量生成微信小程序二维码失败:', error);
        return {
            success: false,
            statusCode: 500,
            message: error instanceof Error ? error.message : '批量生成二维码时发生未知错误',
            results: [],
        };
    }
}

/**
 * 批量查询结果接口
 */
export interface QRCodeBatchQueryResult {
    externalId: string;
    success: boolean;
    data?: {
        id: number;
        scene: string;
        page: string | null;
        width: number;
        qrcodeBuffer: Buffer;
        createdAt: Date;
    };
    error?: string;
}

/**
 * 通过多个 externalId 批量查询二维码
 * @param fastify Fastify 实例
 * @param externalIds externalId 数组
 */
export async function serviceGetQRCodesByExternalIds(
    fastify: FastifyInstance,
    externalIds: string[]
): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    results: QRCodeBatchQueryResult[];
}> {
    try {
        if (!externalIds || externalIds.length === 0) {
            return {
                success: false,
                statusCode: 400,
                message: 'externalIds 参数不能为空',
                results: [],
            };
        }

        const results: QRCodeBatchQueryResult[] = [];

        // 逐个查询每个 externalId（查询最新的一条记录）
        for (const externalId of externalIds) {
            try {
                const record = await fastify.prisma.qrcodeRecord.findFirst({
                    where: {
                        externalId,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                });

                if (record && record.qrcodeData) {
                    results.push({
                        externalId,
                        success: true,
                        data: {
                            id: record.id,
                            scene: record.scene,
                            page: record.page,
                            width: record.width,
                            qrcodeBuffer: Buffer.from(record.qrcodeData),
                            createdAt: record.createdAt,
                        },
                    });
                } else {
                    results.push({
                        externalId,
                        success: false,
                        error: '未找到二维码记录',
                    });
                }
            } catch (error) {
                results.push({
                    externalId,
                    success: false,
                    error: error instanceof Error ? error.message : '查询失败',
                });
            }
        }

        const successCount = results.filter(r => r.success).length;

        return {
            success: successCount > 0,
            statusCode: 200,
            message: `批量查询完成：成功 ${successCount}/${externalIds.length}`,
            results,
        };
    } catch (error) {
        console.error('批量查询二维码失败:', error);
        return {
            success: false,
            statusCode: 500,
            message: error instanceof Error ? error.message : '批量查询时发生未知错误',
            results: [],
        };
    }
}
