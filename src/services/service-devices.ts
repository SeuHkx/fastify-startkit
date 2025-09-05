import { FastifyInstance } from "fastify";
import { parseDataToJson, parseJsonToData } from '@/utils/dataParser';
import fs from 'fs';

/**
 * 设备类型接口
 */
interface DeviceType {
    name: string;
    type: string;
    DINum: number;
    DONum: number;
}

/**
 * 设备类型服务 - 获取设备列表
 * @param fastify Fastify实例
 * @returns 获取结果
 */
export const serviceGetDevices = async (fastify: FastifyInstance) => {
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
            message: '获取设备列表成功',
            success: true,
            data: jsonData.devices || []
        };

    } catch (error) {
        console.error('获取设备列表服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '获取设备列表时发生未知错误',
            success: false,
        };
    }
};

/**
 * 设备类型服务 - 保存设备列表
 * @param fastify Fastify实例
 * @param devices 设备数组
 * @returns 保存结果
 */
export const serviceUpdateDevices = async (fastify: FastifyInstance, devices: DeviceType[]) => {
    try {
        if (!fastify.env.DATABASE_TXT || !fastify.env.DATABASE_JSON) {
            return {
                statusCode: 500,
                message: '数据库配置缺失',
                success: false,
            };
        }

        // 验证设备数据
        if (!Array.isArray(devices)) {
            return {
                statusCode: 400,
                message: '设备数据必须是数组格式',
                success: false,
            };
        }

        // 验证每个设备的必要字段
        for (let i = 0; i < devices.length; i++) {
            const device = devices[i];
            if (!device.name || !device.type) {
                return {
                    statusCode: 400,
                    message: `设备 ${i + 1}: 设备名称和类型都是必需的`,
                    success: false,
                };
            }

            if (typeof device.DINum !== 'number' || device.DINum < 0) {
                return {
                    statusCode: 400,
                    message: `设备 ${i + 1}: 输入点数必须是非负整数`,
                    success: false,
                };
            }

            if (typeof device.DONum !== 'number' || device.DONum < 0) {
                return {
                    statusCode: 400,
                    message: `设备 ${i + 1}: 输出点数必须是非负整数`,
                    success: false,
                };
            }

            // 验证设备名称唯一性
            const duplicateIndex = devices.findIndex((d, index) => 
                index !== i && d.name === device.name
            );
            if (duplicateIndex !== -1) {
                return {
                    statusCode: 400,
                    message: `设备名称 "${device.name}" 重复，请使用唯一的设备名称`,
                    success: false,
                };
            }
        }

        // 读取当前数据
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        // 更新设备配置
        jsonData.devices = devices;

        // 保存更新后的数据到两种格式
        await parseJsonToData(jsonData, fastify.env.DATABASE_TXT);
        
        // 同时更新JSON文件
        await fs.promises.writeFile(fastify.env.DATABASE_JSON, JSON.stringify(jsonData, null, 2), 'utf8');

        return {
            statusCode: 200,
            message: '设备配置保存成功',
            success: true,
            data: jsonData.devices
        };

    } catch (error) {
        console.error('保存设备配置服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '保存设备配置时发生未知错误',
            success: false,
        };
    }
};

/**
 * 设备类型服务 - 添加单个设备
 * @param fastify Fastify实例
 * @param device 设备信息
 * @returns 添加结果
 */
export const serviceAddDevice = async (fastify: FastifyInstance, device: DeviceType) => {
    try {
        if (!fastify.env.DATABASE_TXT || !fastify.env.DATABASE_JSON) {
            return {
                statusCode: 500,
                message: '数据库配置缺失',
                success: false,
            };
        }

        // 验证设备数据
        if (!device.name || !device.type) {
            return {
                statusCode: 400,
                message: '设备名称和类型都是必需的',
                success: false,
            };
        }

        if (typeof device.DINum !== 'number' || device.DINum < 0) {
            return {
                statusCode: 400,
                message: '输入点数必须是非负整数',
                success: false,
            };
        }

        if (typeof device.DONum !== 'number' || device.DONum < 0) {
            return {
                statusCode: 400,
                message: '输出点数必须是非负整数',
                success: false,
            };
        }

        // 读取当前数据
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        if (!jsonData.devices) {
            jsonData.devices = [];
        }

        // 检查设备名称是否已存在
        const existingDevice = jsonData.devices.find((d: DeviceType) => d.name === device.name);
        if (existingDevice) {
            return {
                statusCode: 400,
                message: `设备名称 "${device.name}" 已存在，请使用不同的名称`,
                success: false,
            };
        }

        // 添加新设备
        jsonData.devices.push(device);

        // 保存更新后的数据到两种格式
        await parseJsonToData(jsonData, fastify.env.DATABASE_TXT);
        
        // 同时更新JSON文件
        await fs.promises.writeFile(fastify.env.DATABASE_JSON, JSON.stringify(jsonData, null, 2), 'utf8');

        return {
            statusCode: 200,
            message: '设备添加成功',
            success: true,
            data: device
        };

    } catch (error) {
        console.error('添加设备服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '添加设备时发生未知错误',
            success: false,
        };
    }
};

/**
 * 设备类型服务 - 删除设备
 * @param fastify Fastify实例
 * @param deviceNames 要删除的设备名称数组
 * @returns 删除结果
 */
export const serviceDeleteDevices = async (fastify: FastifyInstance, deviceNames: string[]) => {
    try {
        if (!fastify.env.DATABASE_TXT || !fastify.env.DATABASE_JSON) {
            return {
                statusCode: 500,
                message: '数据库配置缺失',
                success: false,
            };
        }

        if (!Array.isArray(deviceNames) || deviceNames.length === 0) {
            return {
                statusCode: 400,
                message: '请提供要删除的设备名称',
                success: false,
            };
        }

        // 读取当前数据
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        if (!jsonData.devices || jsonData.devices.length === 0) {
            return {
                statusCode: 400,
                message: '没有可删除的设备',
                success: false,
            };
        }

        // 找到要删除的设备
        const devicesToDelete = jsonData.devices.filter((device: DeviceType) => 
            deviceNames.includes(device.name)
        );

        if (devicesToDelete.length === 0) {
            return {
                statusCode: 400,
                message: '未找到指定的设备',
                success: false,
            };
        }

        // 删除设备
        jsonData.devices = jsonData.devices.filter((device: DeviceType) => 
            !deviceNames.includes(device.name)
        );

        // 保存更新后的数据到两种格式
        await parseJsonToData(jsonData, fastify.env.DATABASE_TXT);
        
        // 同时更新JSON文件
        await fs.promises.writeFile(fastify.env.DATABASE_JSON, JSON.stringify(jsonData, null, 2), 'utf8');

        return {
            statusCode: 200,
            message: `成功删除 ${devicesToDelete.length} 个设备`,
            success: true,
            data: {
                deletedDevices: devicesToDelete,
                remainingDevices: jsonData.devices
            }
        };

    } catch (error) {
        console.error('删除设备服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '删除设备时发生未知错误',
            success: false,
        };
    }
};
