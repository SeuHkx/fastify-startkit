import { FastifyInstance } from "fastify";
import fs from 'fs';
import path from 'path';
import { serviceExportDataTxt } from './service-data-conversion';
import { v4 as uuidv4 } from 'uuid';

/**
 * 点位配置接口
 */
interface PointConfig {
    id: number | string;
    type: 'DI' | 'DO' | 'AI' | 'AO';
    code: string;
    statusFeedback: string;
    value: number;
}

/**
 * 设备类型接口
 */
interface DeviceType {
    id?: string; // 设备唯一ID
    name: string;
    code: string;
    status: boolean;
    type?: string; // 兼容旧数据结构
    DINum?: number; // 兼容旧数据结构
    DONum?: number; // 兼容旧数据结构
    points: PointConfig[];
}

/**
 * 设备管理接口 - 用于保存到data.txt格式
 */
interface DeviceManagement {
    name: string;
    type: string;
    DINum: number;
    DONum: number;
    AINum: number;
    conaddr: string;
    retadd: string;
    points: PointConfig[];
}

/**
 * 设备类型数据结构
 */
interface DeviceTypeData {
    devices: DeviceType[];
    lastUpdated?: string;
}

// 设备类型数据文件路径 - 从环境变量获取
const getDeviceTypeDataPath = (fastify: FastifyInstance): string => {
    const envPath = fastify.env.DEVICE_TYPE_DATA_PATH;
    if (envPath) {
        return path.resolve(process.cwd(), envPath);
    }
    // 如果环境变量未设置，使用默认路径
    return path.join(process.cwd(), 'public/data/devices-type-data.json');
};

/**
 * 生成唯一UUID
 */
const generateUniqueId = (): string => {
    return uuidv4();
};

/**
 * 读取设备类型数据
 */
const readDeviceTypeData = async (fastify: FastifyInstance): Promise<DeviceTypeData> => {
    try {
        const dataPath = getDeviceTypeDataPath(fastify);
        
        // 确保目录存在
        const dir = path.dirname(dataPath);
        await fs.promises.mkdir(dir, { recursive: true });
        
        // 检查文件是否存在
        const exists = await fs.promises.access(dataPath).then(() => true).catch(() => false);
        
        if (!exists) {
            // 如果文件不存在，创建空的数据结构
            const initialData: DeviceTypeData = {
                devices: [],
                lastUpdated: new Date().toISOString()
            };
            await fs.promises.writeFile(dataPath, JSON.stringify(initialData, null, 2), 'utf8');
            return initialData;
        }
        
        // 读取现有数据
        const data = await fs.promises.readFile(dataPath, 'utf8');
        const parsedData = JSON.parse(data) as DeviceTypeData;
        
        // 确保数据结构完整
        if (!parsedData.devices) {
            parsedData.devices = [];
        }
        
        // 为没有ID的设备添加ID
        let needsSave = false;
        parsedData.devices.forEach(device => {
            if (!device.id) {
                device.id = generateUniqueId();
                needsSave = true;
            }
        });
        
        // 如果有设备没有ID，保存更新后的数据
        if (needsSave) {
            await fs.promises.writeFile(dataPath, JSON.stringify(parsedData, null, 2), 'utf8');
        }
        
        return parsedData;
    } catch (error) {
        console.error('读取设备类型数据失败:', error);
        // 返回默认数据结构
        return {
            devices: [],
            lastUpdated: new Date().toISOString()
        };
    }
};

/**
 * 保存设备类型数据
 */
const saveDeviceTypeData = async (fastify: FastifyInstance, data: DeviceTypeData): Promise<void> => {
    try {
        const dataPath = getDeviceTypeDataPath(fastify);
        
        // 更新最后修改时间
        data.lastUpdated = new Date().toISOString();
        
        // 确保目录存在
        const dir = path.dirname(dataPath);
        await fs.promises.mkdir(dir, { recursive: true });
        
        // 保存数据
        await fs.promises.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('保存设备类型数据失败:', error);
        throw error;
    }
};

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

        // 从data.txt读取设备数据
        const { parseDataToJson } = await import('@/utils/dataParser');
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
            if (!device.name || !device.code) {
                return {
                    statusCode: 400,
                    message: `设备 ${i + 1}: 设备名称和编码都是必需的`,
                    success: false,
                };
            }

            if (typeof device.status !== 'boolean') {
                return {
                    statusCode: 400,
                    message: `设备 ${i + 1}: 设备状态必须是布尔值`,
                    success: false,
                };
            }

            // 验证点位配置
            if (!Array.isArray(device.points)) {
                return {
                    statusCode: 400,
                    message: `设备 ${i + 1}: 点位配置必须是数组格式`,
                    success: false,
                };
            }

            // 验证每个点位的数据
            for (let j = 0; j < device.points.length; j++) {
                const point = device.points[j];
                if (!point.code || !['DI', 'DO', 'AI', 'AO'].includes(point.type)) {
                    return {
                        statusCode: 400,
                        message: `设备 ${i + 1} 点位 ${j + 1}: 点位编码和类型都是必需的，类型必须是 DI、DO、AI 或 AO`,
                        success: false,
                    };
                }

                if (typeof point.value !== 'number') {
                    return {
                        statusCode: 400,
                        message: `设备 ${i + 1} 点位 ${j + 1}: 点位值必须是数字`,
                        success: false,
                    };
                }
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
        const deviceData = await readDeviceTypeData(fastify);
        
        // 更新设备配置
        deviceData.devices = devices;

        // 保存更新后的数据
        await saveDeviceTypeData(fastify, deviceData);

        return {
            statusCode: 200,
            message: '设备配置保存成功',
            success: true,
            data: deviceData.devices
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
        if (!device.name || !device.code) {
            return {
                statusCode: 400,
                message: '设备名称和编码都是必需的',
                success: false,
            };
        }

        // 读取当前数据
        const { parseDataToJson, parseJsonToData } = await import('@/utils/dataParser');
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        // 验证设备名称唯一性
        const existingDevice = jsonData.devices.find((d: any) => d.name === device.name);
        if (existingDevice) {
            return {
                statusCode: 400,
                message: `设备名称 "${device.name}" 已存在，请使用不同的设备名称`,
                success: false,
            };
        }

        // 验证设备编码唯一性
        const existingCode = jsonData.devices.find((d: any) => d.type === device.code);
        if (existingCode) {
            return {
                statusCode: 400,
                message: `设备编码 "${device.code}" 已存在，请使用不同的设备编码`,
                success: false,
            };
        }

        // 计算点位数量
        const DINum = device.points?.filter(p => p.type === 'DI').length || 0;
        const DONum = device.points?.filter(p => p.type === 'DO').length || 0;
        const AINum = device.points?.filter(p => p.type === 'AI').length || 0;

        // 添加设备到JSON数据
        const newDevice = {
            name: device.name,
            type: device.code,
            DINum,
            DONum,
            AINum,
            conaddr: 0, // 默认值
            retadd: 0   // 默认值
        };

        jsonData.devices.push(newDevice);

        // 保存回data.txt和data.json
        await parseJsonToData(jsonData, fastify.env.DATABASE_TXT);
        
        return {
            statusCode: 201,
            message: '设备添加成功',
            success: true,
            data: newDevice
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
        const { parseDataToJson, parseJsonToData } = await import('@/utils/dataParser');
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        if (!jsonData.devices || jsonData.devices.length === 0) {
            return {
                statusCode: 400,
                message: '没有可删除的设备',
                success: false,
            };
        }

        // 找到要删除的设备
        const devicesToDelete = jsonData.devices.filter((device: any) => 
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
        jsonData.devices = jsonData.devices.filter((device: any) => 
            !deviceNames.includes(device.name)
        );

        // 保存回data.txt和data.json
        await parseJsonToData(jsonData, fastify.env.DATABASE_TXT);

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

// ===================== 设备类型管理服务 =====================

/**
 * 获取设备类型列表服务
 */
export const serviceGetDeviceTypes = async (fastify: FastifyInstance) => {
    try {
        // 读取设备类型数据
        const deviceData = await readDeviceTypeData(fastify);
        
        // 计算每个设备的点位数量
        const devicesWithCounts = deviceData.devices.map(device => ({
            ...device,
            id: device.id || generateUniqueId(), // 确保每个设备都有ID
            DINum: device.points?.filter(p => p.type === 'DI').length || 0,
            DONum: device.points?.filter(p => p.type === 'DO').length || 0,
            AINum: device.points?.filter(p => p.type === 'AI').length || 0,
            AONum: device.points?.filter(p => p.type === 'AO').length || 0
        }));

        return {
            statusCode: 200,
            message: '获取设备类型列表成功',
            success: true,
            data: devicesWithCounts
        };

    } catch (error) {
        console.error('获取设备类型列表服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '获取设备类型列表时发生未知错误',
            success: false,
        };
    }
};

/**
 * 获取单个设备类型服务
 */
export const serviceGetDeviceType = async (fastify: FastifyInstance, deviceId: string) => {
    try {
        // 读取设备类型数据
        const deviceData = await readDeviceTypeData(fastify);
        
        // 查找指定ID的设备类型
        // 支持按ID、数组索引、code或name查找
        let deviceType: DeviceType | undefined;
        
        // 首先尝试按ID查找
        deviceType = deviceData.devices.find(device => device.id === deviceId);
        
        if (!deviceType) {
            // 如果按ID没找到，尝试按索引查找
            const index = parseInt(deviceId);
            if (!isNaN(index) && index >= 0 && index < deviceData.devices.length) {
                deviceType = deviceData.devices[index];
            }
        }
        
        if (!deviceType) {
            // 如果还没找到，尝试按code或name查找
            deviceType = deviceData.devices.find(device => 
                device.code === deviceId || device.name === deviceId
            );
        }
        
        if (!deviceType) {
            return {
                statusCode: 404,
                message: '设备类型不存在',
                success: false,
                data: null
            };
        }

        return {
            statusCode: 200,
            message: '获取设备类型成功',
            success: true,
            data: deviceType
        };
        
    } catch (error) {
        console.error('获取设备类型详情服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '获取设备类型详情时发生未知错误',
            success: false,
            data: null
        };
    }
};

/**
 * 添加设备类型服务
 */
export const serviceAddDeviceType = async (fastify: FastifyInstance, deviceType: DeviceType) => {
    try {
        // 验证必要字段
        if (!deviceType.name || !deviceType.code) {
            return {
                statusCode: 400,
                message: '设备类型名称和编码不能为空',
                success: false,
            };
        }

        // 读取当前数据
        const deviceData = await readDeviceTypeData(fastify);
        
        // 检查是否存在重复的名称或编码
        const existingDevice = deviceData.devices.find(device => 
            device.name === deviceType.name || device.code === deviceType.code
        );
        
        if (existingDevice) {
            return {
                statusCode: 400,
                message: '设备类型名称或编码已存在',
                success: false,
            };
        }

        // 添加新设备类型
        const newDevice: DeviceType = {
            id: generateUniqueId(),
            name: deviceType.name,
            code: deviceType.code,
            status: deviceType.status !== undefined ? deviceType.status : true,
            points: deviceType.points || []
        };

        deviceData.devices.push(newDevice);

        // 保存数据
        await saveDeviceTypeData(fastify, deviceData);

        // 触发更新 data.txt
        try {
            const exportRes = await serviceExportDataTxt(fastify);
            if (!exportRes.success) {
                console.warn('[DeviceType] 更新 data.txt 失败:', exportRes.message);
            }
        } catch (e) {
            console.error('[DeviceType] 更新 data.txt 出错:', e);
        }

        // 返回添加的设备（带有计算的点位数量）
        const deviceWithCounts = {
            ...newDevice,
            DINum: newDevice.points?.filter(p => p.type === 'DI').length || 0,
            DONum: newDevice.points?.filter(p => p.type === 'DO').length || 0,
            AINum: newDevice.points?.filter(p => p.type === 'AI').length || 0,
            AONum: newDevice.points?.filter(p => p.type === 'AO').length || 0
        };

        return {
            statusCode: 201,
            message: '设备类型添加成功',
            success: true,
            data: deviceWithCounts
        };

    } catch (error) {
        console.error('添加设备类型服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '添加设备类型时发生未知错误',
            success: false,
        };
    }
};

/**
 * 更新设备类型服务
 */
export const serviceUpdateDeviceType = async (fastify: FastifyInstance, deviceId: string, updateData: Partial<DeviceType>) => {
    try {
        // 读取当前数据
        const deviceData = await readDeviceTypeData(fastify);
        
        // 查找要更新的设备 - 支持按ID、索引、code或name查找
        let deviceIndex = -1;
        
        // 首先尝试按ID查找
        deviceIndex = deviceData.devices.findIndex(device => device.id === deviceId);
        
        if (deviceIndex === -1) {
            // 如果按ID没找到，尝试按索引查找
            const index = parseInt(deviceId);
            if (!isNaN(index) && index >= 0 && index < deviceData.devices.length) {
                deviceIndex = index;
            }
        }
        
        if (deviceIndex === -1) {
            // 如果还没找到，尝试按code或name查找
            deviceIndex = deviceData.devices.findIndex(device => 
                device.code === deviceId || device.name === deviceId
            );
        }
        
        if (deviceIndex === -1) {
            return {
                statusCode: 404,
                message: '未找到指定的设备类型',
                success: false,
            };
        }

        // 如果更新的是名称或编码，检查是否与其他设备冲突
        if (updateData.name || updateData.code) {
            const conflictDevice = deviceData.devices.find((device, index) => 
                index !== deviceIndex && (
                    (updateData.name && device.name === updateData.name) ||
                    (updateData.code && device.code === updateData.code)
                )
            );
            
            if (conflictDevice) {
                return {
                    statusCode: 400,
                    message: '设备类型名称或编码与其他设备冲突',
                    success: false,
                };
            }
        }

        // 更新设备数据
        const currentDevice = deviceData.devices[deviceIndex];
        const updatedDevice: DeviceType = {
            ...currentDevice,
            ...updateData,
            // 确保必要字段不为空
            name: updateData.name || currentDevice.name,
            code: updateData.code || currentDevice.code,
            points: updateData.points || currentDevice.points || []
        };

        deviceData.devices[deviceIndex] = updatedDevice;

        // 保存数据
        await saveDeviceTypeData(fastify, deviceData);

        // 触发更新 data.txt
        try {
            const exportRes = await serviceExportDataTxt(fastify);
            if (!exportRes.success) {
                console.warn('[DeviceType] 更新 data.txt 失败:', exportRes.message);
            }
        } catch (e) {
            console.error('[DeviceType] 更新 data.txt 出错:', e);
        }

        // 返回更新后的设备（带有计算的点位数量）
        const deviceWithCounts = {
            ...updatedDevice,
            DINum: updatedDevice.points?.filter(p => p.type === 'DI').length || 0,
            DONum: updatedDevice.points?.filter(p => p.type === 'DO').length || 0,
            AINum: updatedDevice.points?.filter(p => p.type === 'AI').length || 0,
            AONum: updatedDevice.points?.filter(p => p.type === 'AO').length || 0
        };

        return {
            statusCode: 200,
            message: '设备类型更新成功',
            success: true,
            data: deviceWithCounts
        };

    } catch (error) {
        console.error('更新设备类型服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '更新设备类型时发生未知错误',
            success: false,
        };
    }
};

/**
 * 删除设备类型服务
 */
export const serviceDeleteDeviceType = async (fastify: FastifyInstance, deviceId: string) => {
    try {
        // 读取设备类型数据 - 与其他设备类型方法保持一致
        const deviceData = await readDeviceTypeData(fastify);
        
        // 查找要删除的设备 - 支持按ID、索引、code或name查找
        let deviceIndex = -1;
        
        // 首先尝试按ID查找
        deviceIndex = deviceData.devices.findIndex(device => device.id === deviceId);
        
        if (deviceIndex === -1) {
            // 如果按ID没找到，尝试按索引查找
            const index = parseInt(deviceId);
            if (!isNaN(index) && index >= 0 && index < deviceData.devices.length) {
                deviceIndex = index;
            }
        }
        
        if (deviceIndex === -1) {
            // 如果还没找到，尝试按code或name查找
            deviceIndex = deviceData.devices.findIndex(device => 
                device.code === deviceId || device.name === deviceId
            );
        }
        
        if (deviceIndex === -1) {
            return {
                statusCode: 404,
                message: '未找到指定的设备类型',
                success: false,
            };
        }

        // 删除设备
        const deletedDevice = deviceData.devices.splice(deviceIndex, 1)[0];

        // 保存数据 - 与其他设备类型方法保持一致
        await saveDeviceTypeData(fastify, deviceData);

        // 触发更新 data.txt
        try {
            const exportRes = await serviceExportDataTxt(fastify);
            if (!exportRes.success) {
                console.warn('[DeviceType] 更新 data.txt 失败:', exportRes.message);
            }
        } catch (e) {
            console.error('[DeviceType] 更新 data.txt 出错:', e);
        }

        return {
            statusCode: 200,
            message: '设备类型删除成功',
            success: true,
            data: {
                deletedDevice
                // remainingDevices: deviceData.devices
            }
        };

    } catch (error) {
        console.error('删除设备类型服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '删除设备类型时发生未知错误',
            success: false,
        };
    }
};

// ===================== 设备管理服务 (data.txt格式) =====================

/**
 * 读取data.txt文件内容
 */
const readDataTxtFile = async (fastify: FastifyInstance): Promise<string> => {
    try {
        const dataPath = fastify.env.DATABASE_TXT || 'public/data/data.txt';
        const fullPath = path.resolve(process.cwd(), dataPath);
        
        const exists = await fs.promises.access(fullPath).then(() => true).catch(() => false);
        if (!exists) {
            // 如果文件不存在，创建默认内容
            const defaultContent = `<u>[username=admin;password=admin;]</u>
<net>[mac=00:07:ce:aa:bc:cc;ip=192.168.1.56;mask=255.255.255.0;gw=192.168.1.1;]</net>
<dev></dev>
`;
            await fs.promises.writeFile(fullPath, defaultContent, 'utf8');
            return defaultContent;
        }
        
        return await fs.promises.readFile(fullPath, 'utf8');
    } catch (error) {
        console.error('读取data.txt文件失败:', error);
        throw error;
    }
};

/**
 * 保存data.txt文件内容
 */
const saveDataTxtFile = async (fastify: FastifyInstance, content: string): Promise<void> => {
    try {
        const dataPath = fastify.env.DATABASE_TXT || 'public/data/data.txt';
        const fullPath = path.resolve(process.cwd(), dataPath);
        
        // 确保目录存在
        const dir = path.dirname(fullPath);
        await fs.promises.mkdir(dir, { recursive: true });
        
        await fs.promises.writeFile(fullPath, content, 'utf8');
    } catch (error) {
        console.error('保存data.txt文件失败:', error);
        throw error;
    }
};

/**
 * 解析设备部分的内容
 */
const parseDeviceSection = (content: string): string[] => {
    const devMatch = content.match(/<dev>(.*?)<\/dev>/s);
    if (!devMatch || !devMatch[1]) {
        return [];
    }
    
    const deviceLines = devMatch[1].trim().split('\n').filter(line => line.trim());
    return deviceLines;
};

/**
 * 添加设备到data.txt格式
 */
export const serviceAddDeviceToDataTxt = async (fastify: FastifyInstance, device: DeviceManagement) => {
    try {
        // 验证必要字段
        if (!device.name || !device.type) {
            return {
                statusCode: 400,
                message: '设备名称和类型不能为空',
                success: false,
            };
        }

        // 读取当前文件内容
        const content = await readDataTxtFile(fastify);
        
        // 解析现有设备
        const deviceLines = parseDeviceSection(content);
        
        // 检查设备名称是否已存在
        const existingDevice = deviceLines.find(line => {
            const nameMatch = line.match(/name=([^;]+);/);
            return nameMatch && nameMatch[1] === device.name;
        });
        
        if (existingDevice) {
            return {
                statusCode: 400,
                message: `设备名称 "${device.name}" 已存在`,
                success: false,
            };
        }

        // 创建新的设备行
        const newDeviceLine = `[name=${device.name};type=${device.type};DINum=${device.DINum};DONum=${device.DONum};AINum=${device.AINum};conaddr=${device.conaddr};retadd=${device.retadd};]`;
        
        // 添加新设备到设备列表
        deviceLines.push(newDeviceLine);
        
        // 重新构建文件内容
        const devSection = deviceLines.join('\n');
        const newContent = content.replace(
            /<dev>.*?<\/dev>/s,
            `<dev>${devSection}</dev>`
        );
        
        // 保存文件
        await saveDataTxtFile(fastify, newContent);

        return {
            statusCode: 201,
            message: '设备添加成功',
            success: true,
            data: {
                name: device.name,
                type: device.type,
                DINum: device.DINum,
                DONum: device.DONum,
                AINum: device.AINum,
                conaddr: device.conaddr,
                retadd: device.retadd
            }
        };

    } catch (error) {
        console.error('添加设备到data.txt失败:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '添加设备时发生未知错误',
            success: false,
        };
    }
};
