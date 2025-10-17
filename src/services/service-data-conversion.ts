import { FastifyInstance } from "fastify";
import fs from 'fs';
import path from 'path';
import { parseJsonToData } from '@/utils/dataParser';

/**
 * 设备类型点位配置接口
 */
interface DeviceTypePoint {
    id: number | string;
    type: 'DI' | 'DO' | 'AI' | 'AO';
    code?: string;
    statusCode?: string;
    statusFeedback?: string;
    value?: number;
    status?: number | string;
    action?: number | string;
}

/**
 * 设备类型接口
 */
interface DeviceType {
    id: string;
    name: string;
    code: string;
    status: boolean;
    points: DeviceTypePoint[];
}

/**
 * 设备实例接口
 */
interface DeviceInstance {
    id: string;
    name: string;
    deviceID?: string;
    deviceTypeId: string;
    conaddr: string;
    retadd: string;
    customPoints?: any[];
    // 已生效点位（可选，历史数据可能存在），但导出时优先通过模板+覆盖现算
    points?: any[];
    // 每台设备实例的通道覆盖（仅保存通道，不改变模板）
    channelOverrides?: Array<{ type: string; code?: string; statusCode?: string; channel: any }>;
    createdAt: string;
    updatedAt: string;
}

/**
 * 设备实例数据结构
 */
interface DeviceInstanceData {
    devices: DeviceInstance[];
    lastUpdated: string;
}

/**
 * 设备类型数据结构
 */
interface DeviceTypeData {
    devices: DeviceType[];
    lastUpdated?: string;
}

/**
 * data.json 格式的设备配置
 */
interface DataJsonDevice {
    name: string;
    type: string;
    DINum: number;
    DONum: number;
    AINum: number;
    conaddr: number | string;
    retadd: number | string;
}

/**
 * data.json 格式的数字输入配置
 */
interface DataJsonDigitalInput {
    channel: string;
    device: string;
    status: number | string;
    bit?: number | string; // 添加 bit 字段
}

/**
 * data.json 格式的数字输出配置
 */
interface DataJsonDigitalOutput {
    channel: string;
    device: string;
    action: number | string;
    bit?: number | string; // 添加 bit 字段
}

/**
 * data.json 格式的模拟输入配置
 */
interface DataJsonAnalogInput {
    channel: string;
    device: string;
    status: string;
}

/**
 * data.json 格式的完整数据结构
 */
interface DataJsonFormat {
    user: {
        username: string;
        password: string;
    };
    network: {
        mac: string;
        ip: string;
        mask: string;
        gateway: string;
    };
    devices: DataJsonDevice[];
    digitalInputs: DataJsonDigitalInput[];
    digitalOutputs: DataJsonDigitalOutput[];
    analogInputs: DataJsonAnalogInput[];
}

// 获取各种数据文件路径
const getDeviceInstanceDataPath = (fastify: FastifyInstance): string => {
    const envPath = fastify.env.DEVICE_DATA;
    if (envPath) {
        return path.resolve(process.cwd(), envPath);
    }
    return path.join(process.cwd(), 'public/data/devices.json');
};

const getDeviceTypeDataPath = (fastify: FastifyInstance): string => {
    const envPath = fastify.env.DEVICE_TYPE_DATA_PATH;
    if (envPath) {
        return path.resolve(process.cwd(), envPath);
    }
    return path.join(process.cwd(), 'public/data/devices-type-data.json');
};

const getDataJsonPath = (fastify: FastifyInstance): string => {
    const envPath = fastify.env.DATA_JSON_PATH;
    if (envPath) {
        return path.resolve(process.cwd(), envPath);
    }
    return path.join(process.cwd(), 'public/data/data.json');
};

// 获取 field.json 路径
const getFieldMappingPath = (fastify: FastifyInstance): string => {
    const envPath = fastify.env.FIELD_MAPPING_PATH;
    if (envPath) {
        return path.resolve(process.cwd(), envPath);
    }
    return path.join(process.cwd(), 'public/data/field.json');
};

// 获取 data.txt 路径
const getDataTxtPath = (fastify: FastifyInstance): string => {
    const envPath = fastify.env.DATA_TXT_PATH;
    if (envPath) {
        return path.resolve(process.cwd(), envPath);
    }
    return path.join(process.cwd(), 'public/data/data.txt');
};

/**
 * 读取字段映射配置
 */
const readFieldMapping = async (fastify: FastifyInstance): Promise<Record<string, string>> => {
    try {
        const fieldPath = getFieldMappingPath(fastify);
        const data = await fs.promises.readFile(fieldPath, 'utf8');
        const fieldMapping = JSON.parse(data) as Record<string, string>;
        console.log('[DataConversion] 字段映射配置已加载:', fieldMapping);
        return fieldMapping;
    } catch (error) {
        console.warn('[DataConversion] 读取字段映射配置失败，使用默认字段名:', error);
        return {}; // 返回空对象，使用原字段名
    }
};

/**
 * 读取设备实例数据
 */
const readDeviceInstanceData = async (fastify: FastifyInstance): Promise<DeviceInstanceData> => {
    try {
        const dataPath = getDeviceInstanceDataPath(fastify);
        const data = await fs.promises.readFile(dataPath, 'utf8');
        return JSON.parse(data) as DeviceInstanceData;
    } catch (error) {
        console.error('读取设备实例数据失败:', error);
        return { devices: [], lastUpdated: new Date().toISOString() };
    }
};

/**
 * 读取设备类型数据
 */
const readDeviceTypeData = async (fastify: FastifyInstance): Promise<DeviceTypeData> => {
    try {
        const dataPath = getDeviceTypeDataPath(fastify);
        const data = await fs.promises.readFile(dataPath, 'utf8');
        return JSON.parse(data) as DeviceTypeData;
    } catch (error) {
        console.error('读取设备类型数据失败:', error);
        return { devices: [], lastUpdated: new Date().toISOString() };
    }
};

/**
 * 读取现有的 data.json 数据（保留用户和网络配置）
 */
const readExistingDataJson = async (fastify: FastifyInstance): Promise<Partial<DataJsonFormat>> => {
    try {
        const dataPath = getDataJsonPath(fastify);
        const data = await fs.promises.readFile(dataPath, 'utf8');
        const parsedData = JSON.parse(data) as DataJsonFormat;
        
        // 只保留用户和网络配置，设备相关数据将被重新生成
        return {
            user: parsedData.user || { username: "admin", password: "admin" },
            network: parsedData.network || {
                mac: "00:07:ce:aa:bc:cc",
                ip: "192.168.1.56",
                mask: "255.255.255.0",
                gateway: "192.168.1.1"
            }
        };
    } catch (error) {
        console.error('读取现有 data.json 失败，使用默认配置:', error);
        return {
            user: { username: "admin", password: "admin" },
            network: {
                mac: "00:07:ce:aa:bc:cc",
                ip: "192.168.1.56",
                mask: "255.255.255.0",
                gateway: "192.168.1.1"
            }
        };
    }
};

/**
 * 统计点位数量
 */
const countPointsByType = (points: any[], type: string): number => {
    return points.filter(point => point.type === type).length;
};

/**
 * 生成通道名称（如果没有指定通道）
 */
const generateChannelName = (type: string, index: number): string => {
    return `${type}${index}`;
};

/**
 * 规范化通道：将占位/未选择的值转换为 undefined
 */
const normalizeChannel = (value: any): string | undefined => {
    if (value === undefined || value === null) return undefined;
    const s = String(value).trim();
    if (!s) return undefined;
    // 常见占位文案
    const placeholders = new Set(['请选择', 'Please select', 'select', '请选择通道']);
    if (placeholders.has(s)) return undefined;
    return s;
};

/**
 * 安全转换为数字（如果可能）
 */
const safeNumberConversion = (value: any): number | string => {
    if (value === undefined || value === null || value === '') {
        return value;
    }
    
    // 如果已经是数字，直接返回
    if (typeof value === 'number') {
        return value;
    }
    
    // 如果是字符串，尝试转换为数字
    if (typeof value === 'string') {
        const trimmed = value.trim();
        // 检查是否为空字符串
        if (trimmed === '') {
            return value;
        }
        // 检查是否为纯数字字符串
        const num = Number(trimmed);
        if (!isNaN(num) && isFinite(num)) {
            return num;
        }
    }
    
    // 其他情况保持原值
    return value;
};

/**
 * 转换设备数据为 data.json 格式
 */
export const serviceConvertToDataJsonFormat = async (fastify: FastifyInstance) => {
    try {
        console.log('[DataConversion] 开始转换数据为 data.json 格式');

        // 读取各种数据
        const deviceInstanceData = await readDeviceInstanceData(fastify);
        const deviceTypeData = await readDeviceTypeData(fastify);
        const existingData = await readExistingDataJson(fastify);

        // 创建设备类型映射
        const deviceTypeMap = new Map<string, DeviceType>();
        deviceTypeData.devices.forEach(deviceType => {
            deviceTypeMap.set(deviceType.id, deviceType);
        });

        // 转换设备列表
        const devices: DataJsonDevice[] = [];
        const digitalInputs: DataJsonDigitalInput[] = [];
        const digitalOutputs: DataJsonDigitalOutput[] = [];
        const analogInputs: DataJsonAnalogInput[] = [];

        // 用于生成全局通道索引
        let globalDIIndex = 0;
        let globalDOIndex = 0;
        let globalAIIndex = 0;

        for (const deviceInstance of deviceInstanceData.devices) {
            const deviceType = deviceTypeMap.get(deviceInstance.deviceTypeId);
            
            if (!deviceType) {
                console.warn(`设备类型未找到: ${deviceInstance.deviceTypeId}, 跳过设备: ${deviceInstance.name}`);
                continue;
            }

            // 计算有效点位：模板 + 自定义 + 通道覆盖
            const basePoints = [
                ...(deviceType.points || []),
                ...(deviceInstance.customPoints || [])
            ];
            const mk = (p: any) => `${p?.type || ''}::${p?.code || p?.statusCode || ''}`;
            // 优先使用 channelOverrides；若无，则回退到已保存的 points 中的通道
            const ovMap = new Map<string, string>();
            if (Array.isArray(deviceInstance.channelOverrides) && deviceInstance.channelOverrides.length > 0) {
                for (const o of deviceInstance.channelOverrides) {
                    const key = `${o?.type || ''}::${o?.code || o?.statusCode || ''}`;
                    const ch = normalizeChannel((o as any)?.channel);
                    if (key && ch) ovMap.set(key, ch);
                }
            } else if (Array.isArray(deviceInstance.points) && deviceInstance.points.length > 0) {
                for (const p of deviceInstance.points as any[]) {
                    const key = mk(p);
                    const ch = normalizeChannel((p as any)?.channel);
                    if (key && ch) ovMap.set(key, ch);
                }
            }
            const allPoints = basePoints.map(p => ({
                ...p,
                channel: ovMap.get(mk(p)) ?? p.channel
            }));

            // 统计各类型点位数量
            const DINum = countPointsByType(allPoints, 'DI');
            const DONum = countPointsByType(allPoints, 'DO');
            const AINum = countPointsByType(allPoints, 'AI');
            const AONum = countPointsByType(allPoints, 'AO');

            // 创建设备配置
            const deviceConfig: DataJsonDevice = {
                name: deviceInstance.name,
                type: deviceType.code || deviceType.name,
                DINum,
                DONum,
                AINum: AINum + AONum, // AO 也算作 AI
                conaddr: parseInt(deviceInstance.conaddr) || deviceInstance.conaddr,
                retadd: parseInt(deviceInstance.retadd) || deviceInstance.retadd
            };

            devices.push(deviceConfig);

            // 处理数字输入点位 (DI)
        const diPoints = allPoints.filter(point => point.type === 'DI');
            diPoints.forEach((point, index) => {
                const digitalInput: DataJsonDigitalInput = {
            channel: normalizeChannel(point.channel) || generateChannelName('DI', globalDIIndex),
                    device: deviceInstance.name,
                    status: safeNumberConversion(point.status !== undefined ? point.status : (point.value !== undefined ? point.value : 1))
                };
                
                // 添加 bit 字段（如果存在）
                if (point.bit !== undefined) {
                    digitalInput.bit = safeNumberConversion(point.bit);
                }
                
                digitalInputs.push(digitalInput);
                globalDIIndex++;
            });

            // 处理数字输出点位 (DO)
        const doPoints = allPoints.filter(point => point.type === 'DO');
            doPoints.forEach((point, index) => {
                const digitalOutput: DataJsonDigitalOutput = {
            channel: normalizeChannel(point.channel) || generateChannelName('DO', globalDOIndex),
                    device: deviceInstance.name,
                    action: safeNumberConversion(point.action !== undefined ? point.action : (point.value !== undefined ? point.value : 0))
                };
                
                // 添加 bit 字段（如果存在）
                if (point.bit !== undefined) {
                    digitalOutput.bit = safeNumberConversion(point.bit);
                }
                
                digitalOutputs.push(digitalOutput);
                globalDOIndex++;
            });

            // 处理模拟输入点位 (AI 和 AO)
        const aiPoints = allPoints.filter(point => point.type === 'AI' || point.type === 'AO');
            aiPoints.forEach((point, index) => {
                const analogInput: DataJsonAnalogInput = {
            channel: normalizeChannel(point.channel) || generateChannelName('AI', globalAIIndex),
                    device: deviceInstance.name,
                    status: point.statusFeedback || point.statusCode || 'unknown'
                };
                analogInputs.push(analogInput);
                globalAIIndex++;
            });
        }

        // 构建完整的 data.json 格式数据
        const dataJsonFormat: DataJsonFormat = {
            user: existingData.user!,
            network: existingData.network!,
            devices,
            digitalInputs,
            digitalOutputs,
            analogInputs
        };

        // 保存到 data.json
        const dataJsonPath = getDataJsonPath(fastify);
        const dir = path.dirname(dataJsonPath);
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(dataJsonPath, JSON.stringify(dataJsonFormat, null, 2), 'utf8');

        console.log('[DataConversion] 数据转换完成，已保存到 data.json');

        return {
            statusCode: 200,
            message: '数据转换成功',
            success: true,
            data: {
                devicesCount: devices.length,
                digitalInputsCount: digitalInputs.length,
                digitalOutputsCount: digitalOutputs.length,
                analogInputsCount: analogInputs.length,
                filePath: dataJsonPath
            }
        };

    } catch (error) {
        console.error('[DataConversion] 数据转换失败:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '数据转换时发生未知错误',
            success: false,
        };
    }
};

/**
 * 获取转换后的 data.json 数据
 */
export const serviceGetDataJsonFormat = async (fastify: FastifyInstance) => {
    try {
        const dataJsonPath = getDataJsonPath(fastify);
        const data = await fs.promises.readFile(dataJsonPath, 'utf8');
        const parsedData = JSON.parse(data) as DataJsonFormat;

        return {
            statusCode: 200,
            message: '获取 data.json 数据成功',
            success: true,
            data: parsedData
        };

    } catch (error) {
        console.error('获取 data.json 数据失败:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '获取 data.json 数据时发生未知错误',
            success: false,
        };
    }
};

/**
 * 基于 devices-type-data.json、devices.json 和 data.json 生成 data.txt
 * 过程：先转换/刷新 data.json，再将其转为 data.txt 并写入文件。
 */
export const serviceExportDataTxt = async (fastify: FastifyInstance) => {
    try {
        // 先确保 data.json 是最新的
        const convertRes = await serviceConvertToDataJsonFormat(fastify);
        if (!convertRes.success) {
            console.warn('[DataConversion] 刷新 data.json 失败，尝试使用现有 data.json');
        }

        const dataJsonPath = getDataJsonPath(fastify);
        const dataTxtPath = getDataTxtPath(fastify);

        // 读取 data.json
        const dataStr = await fs.promises.readFile(dataJsonPath, 'utf8');
        const dataJson = JSON.parse(dataStr);

        // 读取字段映射配置
        const fieldMapping = await readFieldMapping(fastify);

        // 转成 data.txt 并写入文件
        await parseJsonToData(dataJson, dataTxtPath, fieldMapping);

        return {
            statusCode: 200,
            message: 'data.txt 生成成功',
            success: true,
            data: {
                filePath: dataTxtPath,
                fieldMapping
            }
        };
    } catch (error) {
        console.error('[DataConversion] 生成 data.txt 失败:', error);
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '生成 data.txt 时发生未知错误',
            success: false,
        };
    }
};
