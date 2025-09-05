import { FastifyInstance } from "fastify";
import { parseDataToJson, parseJsonToData } from '@/utils/dataParser';
import fs from 'fs';

/**
 * 数字输入接口
 */
interface DigitalInput {
    channel: string;
    device: string;
    status: number;
}

/**
 * 数字输入服务 - 获取数字输入列表
 * @param fastify Fastify实例
 * @returns 获取结果
 */
export const serviceGetDigitalInputs = async (fastify: FastifyInstance) => {
    try {
        if (!fastify.env.DATABASE_TXT || !fastify.env.DATABASE_JSON) {
            return {
                statusCode: 500,
                message: '数据库配置缺失',
                success: false,
            };
        }

        // 读取当前数据
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        return {
            statusCode: 200,
            message: '获取数字输入列表成功',
            success: true,
            data: jsonData.digitalInputs || []
        };

    } catch (error) {
        console.error('获取数字输入列表服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '获取数字输入列表时发生未知错误',
            success: false,
        };
    }
};

/**
 * 数字输入服务 - 保存数字输入列表
 * @param fastify Fastify实例
 * @param digitalInputs 数字输入数组
 * @returns 保存结果
 */
export const serviceUpdateDigitalInputs = async (fastify: FastifyInstance, digitalInputs: DigitalInput[]) => {
    try {
        if (!fastify.env.DATABASE_TXT || !fastify.env.DATABASE_JSON) {
            return {
                statusCode: 500,
                message: '数据库配置缺失',
                success: false,
            };
        }

        // 验证数字输入数据
        if (!Array.isArray(digitalInputs)) {
            return {
                statusCode: 400,
                message: '数字输入数据必须是数组格式',
                success: false,
            };
        }

        // 验证每个数字输入的必要字段
        for (let i = 0; i < digitalInputs.length; i++) {
            const di = digitalInputs[i];
            if (!di.channel || !di.device) {
                return {
                    statusCode: 400,
                    message: `数字输入 ${i + 1}: 通道名称和设备名称都是必需的`,
                    success: false,
                };
            }

            // 验证通道名称格式 (DIx 格式)
            if (!/^DI\d+$/.test(di.channel)) {
                return {
                    statusCode: 400,
                    message: `数字输入 ${i + 1}: 通道名称必须是 DI 加数字的格式 (如: DI0, DI1)`,
                    success: false,
                };
            }

            if (typeof di.status !== 'number') {
                return {
                    statusCode: 400,
                    message: `数字输入 ${i + 1}: 状态值必须是数字`,
                    success: false,
                };
            }

            // 验证通道名称唯一性
            const duplicateIndex = digitalInputs.findIndex((d, index) => 
                index !== i && d.channel === di.channel
            );
            if (duplicateIndex !== -1) {
                return {
                    statusCode: 400,
                    message: `通道名称 "${di.channel}" 重复，请使用唯一的通道名称`,
                    success: false,
                };
            }
        }

        // 读取当前数据
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        // 验证设备名称是否存在
        const availableDevices = (jsonData.devices || []).map((device: any) => device.name);
        for (let i = 0; i < digitalInputs.length; i++) {
            const di = digitalInputs[i];
            if (!availableDevices.includes(di.device)) {
                return {
                    statusCode: 400,
                    message: `数字输入 ${i + 1}: 设备 "${di.device}" 不存在，请先添加该设备`,
                    success: false,
                };
            }
        }

        // 更新数字输入配置
        jsonData.digitalInputs = digitalInputs;

        // 保存更新后的数据到两种格式
        await parseJsonToData(jsonData, fastify.env.DATABASE_TXT);
        
        // 同时更新JSON文件
        await fs.promises.writeFile(fastify.env.DATABASE_JSON, JSON.stringify(jsonData, null, 2), 'utf8');

        return {
            statusCode: 200,
            message: '数字输入配置保存成功',
            success: true,
            data: jsonData.digitalInputs
        };

    } catch (error) {
        console.error('保存数字输入配置服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '保存数字输入配置时发生未知错误',
            success: false,
        };
    }
};

/**
 * 数字输入服务 - 添加单个数字输入
 * @param fastify Fastify实例
 * @param digitalInput 数字输入信息
 * @returns 添加结果
 */
export const serviceAddDigitalInput = async (fastify: FastifyInstance, digitalInput: DigitalInput) => {
    try {
        if (!fastify.env.DATABASE_TXT || !fastify.env.DATABASE_JSON) {
            return {
                statusCode: 500,
                message: '数据库配置缺失',
                success: false,
            };
        }

        // 验证数字输入数据
        if (!digitalInput.channel || !digitalInput.device) {
            return {
                statusCode: 400,
                message: '通道名称和设备名称都是必需的',
                success: false,
            };
        }

        // 验证通道名称格式
        if (!/^DI\d+$/.test(digitalInput.channel)) {
            return {
                statusCode: 400,
                message: '通道名称必须是 DI 加数字的格式 (如: DI0, DI1)',
                success: false,
            };
        }

        if (typeof digitalInput.status !== 'number') {
            return {
                statusCode: 400,
                message: '状态值必须是数字',
                success: false,
            };
        }

        // 读取当前数据
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        if (!jsonData.digitalInputs) {
            jsonData.digitalInputs = [];
        }

        // 验证设备名称是否存在
        const availableDevices = (jsonData.devices || []).map((device: any) => device.name);
        if (!availableDevices.includes(digitalInput.device)) {
            return {
                statusCode: 400,
                message: `设备 "${digitalInput.device}" 不存在，请先添加该设备`,
                success: false,
            };
        }

        // 检查通道名称是否已存在
        const existingDI = jsonData.digitalInputs.find((di: DigitalInput) => di.channel === digitalInput.channel);
        if (existingDI) {
            return {
                statusCode: 400,
                message: `通道名称 "${digitalInput.channel}" 已存在，请使用不同的通道名称`,
                success: false,
            };
        }

        // 添加新数字输入
        jsonData.digitalInputs.push(digitalInput);

        // 保存更新后的数据到两种格式
        await parseJsonToData(jsonData, fastify.env.DATABASE_TXT);
        
        // 同时更新JSON文件
        await fs.promises.writeFile(fastify.env.DATABASE_JSON, JSON.stringify(jsonData, null, 2), 'utf8');

        return {
            statusCode: 200,
            message: '数字输入添加成功',
            success: true,
            data: digitalInput
        };

    } catch (error) {
        console.error('添加数字输入服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '添加数字输入时发生未知错误',
            success: false,
        };
    }
};

/**
 * 数字输入服务 - 删除数字输入
 * @param fastify Fastify实例
 * @param channels 要删除的通道名称数组
 * @returns 删除结果
 */
export const serviceDeleteDigitalInputs = async (fastify: FastifyInstance, channels: string[]) => {
    try {
        if (!fastify.env.DATABASE_TXT || !fastify.env.DATABASE_JSON) {
            return {
                statusCode: 500,
                message: '数据库配置缺失',
                success: false,
            };
        }

        if (!Array.isArray(channels) || channels.length === 0) {
            return {
                statusCode: 400,
                message: '请提供要删除的通道名称',
                success: false,
            };
        }

        // 读取当前数据
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        if (!jsonData.digitalInputs || jsonData.digitalInputs.length === 0) {
            return {
                statusCode: 400,
                message: '没有可删除的数字输入',
                success: false,
            };
        }

        // 找到要删除的数字输入
        const digitalInputsToDelete = jsonData.digitalInputs.filter((di: DigitalInput) => 
            channels.includes(di.channel)
        );

        if (digitalInputsToDelete.length === 0) {
            return {
                statusCode: 400,
                message: '未找到指定的数字输入',
                success: false,
            };
        }

        // 删除数字输入
        jsonData.digitalInputs = jsonData.digitalInputs.filter((di: DigitalInput) => 
            !channels.includes(di.channel)
        );

        // 保存更新后的数据到两种格式
        await parseJsonToData(jsonData, fastify.env.DATABASE_TXT);
        
        // 同时更新JSON文件
        await fs.promises.writeFile(fastify.env.DATABASE_JSON, JSON.stringify(jsonData, null, 2), 'utf8');

        return {
            statusCode: 200,
            message: `成功删除 ${digitalInputsToDelete.length} 个数字输入`,
            success: true,
            data: {
                deletedDigitalInputs: digitalInputsToDelete,
                remainingDigitalInputs: jsonData.digitalInputs
            }
        };

    } catch (error) {
        console.error('删除数字输入服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '删除数字输入时发生未知错误',
            success: false,
        };
    }
};

/**
 * 获取可用设备列表服务
 * @param fastify Fastify实例
 * @returns 设备列表
 */
export const serviceGetAvailableDevices = async (fastify: FastifyInstance) => {
    try {
        if (!fastify.env.DATABASE_TXT || !fastify.env.DATABASE_JSON) {
            return {
                statusCode: 500,
                message: '数据库配置缺失',
                success: false,
            };
        }

        // 读取当前数据
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        return {
            statusCode: 200,
            message: '获取可用设备列表成功',
            success: true,
            data: jsonData.devices || []
        };

    } catch (error) {
        console.error('获取可用设备列表服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '获取可用设备列表时发生未知错误',
            success: false,
        };
    }
};
