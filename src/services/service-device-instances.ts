import { FastifyInstance } from "fastify";
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { serviceExportDataTxt } from './service-data-conversion';

/**
 * 设备实例接口 - 简化版，只保留必要字段
 */
interface DeviceInstance {
    id: string;
    name: string;
    deviceTypeId: string; // 关联的设备类型ID
    conaddr: string;
    retadd: string;
    // 设备实例独立的点位配置（完全独立，支持完全自定义修改）
    independentPoints: any[];
    createdAt: string;
    updatedAt: string;
}

/**
 * 设备实例数据结构
 */
interface DeviceInstanceData {
    devices: DeviceInstance[];
    lastUpdated: string;
}/**
 * 设备实例数据结构
 */
interface DeviceInstanceData {
    devices: DeviceInstance[];
    lastUpdated: string;
}

/**
 * 设备实例接口
 */
interface DeviceInstance {
    id: string;
    name: string;
    deviceTypeId: string; // 关联的设备类型ID
    conaddr: string;
    retadd: string;
    customPoints?: any[]; // 自定义点位配置（非模板点位）
    // 实际生效点位（设备类型模板点位 + 自定义点位），用于持久化到 devices.json
    points?: any[];
    // 每台设备实例对“模板点位”的通道覆盖（仅保存通道，不改变默认模板）
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

// 设备实例数据文件路径
const getDeviceDataPath = (fastify: FastifyInstance): string => {
    const envPath = fastify.env.DEVICE_DATA;
    if (envPath) {
        return path.resolve(process.cwd(), envPath);
    }
    return path.join(process.cwd(), 'public/data/devices.json');
};

// 设备类型数据文件路径
const getDeviceTypeDataPath = (fastify: FastifyInstance): string => {
    const envPath = fastify.env.DEVICE_TYPE_DATA_PATH;
    if (envPath) {
        return path.resolve(process.cwd(), envPath);
    }
    return path.join(process.cwd(), 'public/data/devices-type-data.json');
};

// 读取设备类型数据（仅需 id 与 points）
interface DeviceTypeLite {
    id: string;
    points?: any[];
}

const readDeviceTypeDataLite = async (fastify: FastifyInstance): Promise<{ devices: DeviceTypeLite[] }> => {
    try {
        const p = getDeviceTypeDataPath(fastify);
        const raw = await fs.promises.readFile(p, 'utf8');
        const json = JSON.parse(raw);
        return { devices: Array.isArray(json?.devices) ? json.devices : [] };
    } catch {
        return { devices: [] };
    }
};

/**
 * 读取设备实例数据
 */
const readDeviceInstanceData = async (fastify: FastifyInstance): Promise<DeviceInstanceData> => {
    try {
        const dataPath = getDeviceDataPath(fastify);
        
        // 确保目录存在
        const dir = path.dirname(dataPath);
        await fs.promises.mkdir(dir, { recursive: true });
        
        // 检查文件是否存在
        const exists = await fs.promises.access(dataPath).then(() => true).catch(() => false);
        
        if (!exists) {
            // 如果文件不存在，创建空的数据结构
            const initialData: DeviceInstanceData = {
                devices: [],
                lastUpdated: new Date().toISOString()
            };
            await fs.promises.writeFile(dataPath, JSON.stringify(initialData, null, 2), 'utf8');
            return initialData;
        }
        
        // 读取现有数据
        const data = await fs.promises.readFile(dataPath, 'utf8');
        const parsedData = JSON.parse(data) as DeviceInstanceData;
        
        // 确保数据结构完整
        if (!parsedData.devices) {
            parsedData.devices = [];
        }
        
        return parsedData;
    } catch (error) {
        console.error('读取设备实例数据失败:', error);
        return {
            devices: [],
            lastUpdated: new Date().toISOString()
        };
    }
};

/**
 * 保存设备实例数据
 */
const saveDeviceInstanceData = async (fastify: FastifyInstance, data: DeviceInstanceData): Promise<void> => {
    try {
        const dataPath = getDeviceDataPath(fastify);
        
        // 更新最后修改时间
        data.lastUpdated = new Date().toISOString();
        
        // 确保目录存在
        const dir = path.dirname(dataPath);
        await fs.promises.mkdir(dir, { recursive: true });
        
        // 保存数据
        await fs.promises.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('保存设备实例数据失败:', error);
        throw error;
    }
};

/**
 * 获取所有设备实例
 */
export const serviceGetDeviceInstances = async (fastify: FastifyInstance) => {
    try {
        const deviceData = await readDeviceInstanceData(fastify);
        
        return {
            statusCode: 200,
            message: '获取设备实例列表成功',
            success: true,
            data: deviceData.devices || []
        };

    } catch (error) {
        console.error('获取设备实例列表服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '获取设备实例列表时发生未知错误',
            success: false,
        };
    }
};

/**
 * 添加设备实例
 */
export const serviceAddDeviceInstance = async (
    fastify: FastifyInstance, 
    deviceInstance: Omit<DeviceInstance, 'id' | 'createdAt' | 'updatedAt'>
) => {
    try {
        // 验证必要字段
        if (!deviceInstance.name || !deviceInstance.deviceTypeId) {
            return {
                statusCode: 400,
                message: '设备名称和设备类型ID不能为空',
                success: false,
            };
        }

        // 读取当前数据
        const deviceData = await readDeviceInstanceData(fastify);
        
        // 验证设备名称唯一性
        const existingDevice = deviceData.devices.find(d => d.name === deviceInstance.name);
        if (existingDevice) {
            return {
                statusCode: 400,
                message: `设备名称 "${deviceInstance.name}" 已存在，请使用不同的设备名称`,
                success: false,
            };
        }

        // 处理点位配置：默认使用独立点位配置
        let finalPoints: any[] = [];
        
        if (deviceInstance.independentPoints && deviceInstance.independentPoints.length > 0) {
            // 使用传入的独立点位配置
            finalPoints = deviceInstance.independentPoints;
        } else {
            // 如果没有独立配置，从模板创建初始独立配置
            const typeData = await readDeviceTypeDataLite(fastify);
            const type = typeData.devices.find(d => d.id === deviceInstance.deviceTypeId);
            if (type?.points) {
                finalPoints = (type.points as any[]).map((point: any) => ({
                    ...point,
                    channel: '请选择', // 设置默认通道值
                    bit: point.bit // 保持bit字段
                }));
            }
        }

        // 创建新设备实例
        const newDevice: DeviceInstance = {
            id: uuidv4(),
            name: deviceInstance.name,
            deviceTypeId: deviceInstance.deviceTypeId,
            conaddr: deviceInstance.conaddr,
            retadd: deviceInstance.retadd,
            independentPoints: finalPoints, // 使用独立配置
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 添加到设备列表
        deviceData.devices.push(newDevice);

        // 保存数据
        await saveDeviceInstanceData(fastify, deviceData);

        // 触发数据转换并生成 data.txt
        try {
            const exportRes = await serviceExportDataTxt(fastify);
            if (exportRes.success) {
                console.log('[DeviceInstance] 已更新 data.txt');
            } else {
                console.warn('[DeviceInstance] 更新 data.txt 失败:', exportRes.message);
            }
        } catch (conversionError) {
            console.error('[DeviceInstance] 数据转换过程中发生错误:', conversionError);
            // 不影响设备添加的主要流程
        }

        return {
            statusCode: 201,
            message: '设备实例添加成功',
            success: true,
            data: newDevice
        };

    } catch (error) {
        console.error('添加设备实例服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '添加设备实例时发生未知错误',
            success: false,
        };
    }
};

/**
 * 更新设备实例
 */
export const serviceUpdateDeviceInstance = async (
    fastify: FastifyInstance, 
    deviceId: string, 
    updateData: Partial<Omit<DeviceInstance, 'id' | 'createdAt' | 'updatedAt'>>
) => {
    try {
        // 读取当前数据
        const deviceData = await readDeviceInstanceData(fastify);
        
        // 查找要更新的设备
        const deviceIndex = deviceData.devices.findIndex(device => device.id === deviceId);
        
        if (deviceIndex === -1) {
            return {
                statusCode: 404,
                message: '未找到指定的设备实例',
                success: false,
            };
        }

        // 如果更新的是名称，检查是否与其他设备冲突
        if (updateData.name) {
            const conflictDevice = deviceData.devices.find((device, index) => 
                index !== deviceIndex && device.name === updateData.name
            );
            
            if (conflictDevice) {
                return {
                    statusCode: 400,
                    message: '设备名称与其他设备冲突',
                    success: false,
                };
            }
        }

        // 获取当前设备
        const currentDevice = deviceData.devices[deviceIndex];
        
        // 处理点位配置更新
        let independentPoints = currentDevice.independentPoints || [];
        
        // 检查是否需要重新生成点位配置
        const typeChanged = updateData.deviceTypeId && updateData.deviceTypeId !== currentDevice.deviceTypeId;
        const independentChanged = Array.isArray(updateData.independentPoints);

        if (independentChanged && updateData.independentPoints) {
            // 使用传入的独立点位配置
            independentPoints = updateData.independentPoints as any[];
        } else if (typeChanged) {
            // 设备类型改变时，从新模板创建独立配置
            const typeData = await readDeviceTypeDataLite(fastify);
            const type = typeData.devices.find(d => d.id === (updateData.deviceTypeId || currentDevice.deviceTypeId));
            if (type?.points) {
                independentPoints = (type.points as any[]).map((point: any) => ({
                    ...point,
                    channel: '请选择',
                    bit: point.bit // 保持bit字段
                }));
            }
        }

        // 创建更新后的设备对象
        const updatedDevice: DeviceInstance = {
            ...currentDevice,
            name: updateData.name || currentDevice.name,
            deviceTypeId: updateData.deviceTypeId || currentDevice.deviceTypeId,
            conaddr: updateData.conaddr || currentDevice.conaddr,
            retadd: updateData.retadd || currentDevice.retadd,
            independentPoints,
            updatedAt: new Date().toISOString()
        };

        deviceData.devices[deviceIndex] = updatedDevice;

        // 保存数据
        await saveDeviceInstanceData(fastify, deviceData);

        // 触发数据转换并生成 data.txt
        try {
            const exportRes = await serviceExportDataTxt(fastify);
            if (exportRes.success) {
                console.log('[DeviceInstance] 已更新 data.txt');
            } else {
                console.warn('[DeviceInstance] 更新 data.txt 失败:', exportRes.message);
            }
        } catch (conversionError) {
            console.error('[DeviceInstance] 数据转换过程中发生错误:', conversionError);
            // 不影响设备更新的主要流程
        }

        return {
            statusCode: 200,
            message: '设备实例更新成功',
            success: true,
            data: updatedDevice
        };

    } catch (error) {
        console.error('更新设备实例服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '更新设备实例时发生未知错误',
            success: false,
        };
    }
};

/**
 * 删除设备实例
 */
export const serviceDeleteDeviceInstance = async (fastify: FastifyInstance, deviceId: string) => {
    try {
        // 读取当前数据
        const deviceData = await readDeviceInstanceData(fastify);
        
        // 查找要删除的设备
        const deviceIndex = deviceData.devices.findIndex(device => device.id === deviceId);
        
        if (deviceIndex === -1) {
            return {
                statusCode: 404,
                message: '未找到指定的设备实例',
                success: false,
            };
        }

        // 删除设备
        const deletedDevice = deviceData.devices.splice(deviceIndex, 1)[0];

        // 保存数据
        await saveDeviceInstanceData(fastify, deviceData);

        // 触发数据转换并生成 data.txt
        try {
            const exportRes = await serviceExportDataTxt(fastify);
            if (exportRes.success) {
                console.log('[DeviceInstance] 已更新 data.txt');
            } else {
                console.warn('[DeviceInstance] 更新 data.txt 失败:', exportRes.message);
            }
        } catch (conversionError) {
            console.error('[DeviceInstance] 数据转换过程中发生错误:', conversionError);
            // 不影响设备删除的主要流程
        }

        return {
            statusCode: 200,
            message: '设备实例删除成功',
            success: true,
            data: {
                deletedDevice,
                remainingDevices: deviceData.devices
            }
        };

    } catch (error) {
        console.error('删除设备实例服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '删除设备实例时发生未知错误',
            success: false,
        };
    }
};

/**
 * 批量删除设备实例
 */
export const serviceDeleteDeviceInstances = async (fastify: FastifyInstance, deviceIds: string[]) => {
    try {
        if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
            return {
                statusCode: 400,
                message: '请提供要删除的设备ID列表',
                success: false,
            };
        }

        // 读取当前数据
        const deviceData = await readDeviceInstanceData(fastify);
        
        // 找到要删除的设备
        const devicesToDelete = deviceData.devices.filter(device => 
            deviceIds.includes(device.id)
        );

        if (devicesToDelete.length === 0) {
            return {
                statusCode: 400,
                message: '未找到指定的设备实例',
                success: false,
            };
        }

        // 删除设备
        deviceData.devices = deviceData.devices.filter(device => 
            !deviceIds.includes(device.id)
        );

        // 保存数据
        await saveDeviceInstanceData(fastify, deviceData);

        // 触发数据转换并生成 data.txt
        try {
            const exportRes = await serviceExportDataTxt(fastify);
            if (exportRes.success) {
                console.log('[DeviceInstance] 已更新 data.txt');
            } else {
                console.warn('[DeviceInstance] 更新 data.txt 失败:', exportRes.message);
            }
        } catch (conversionError) {
            console.error('[DeviceInstance] 数据转换过程中发生错误:', conversionError);
            // 不影响批量删除的主要流程
        }

        return {
            statusCode: 200,
            message: `成功删除 ${devicesToDelete.length} 个设备实例`,
            success: true,
            data: {
                deletedDevices: devicesToDelete,
                remainingDevices: deviceData.devices
            }
        };

    } catch (error) {
        console.error('批量删除设备实例服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '批量删除设备实例时发生未知错误',
            success: false,
        };
    }
};

/**
 * 根据设备类型ID获取设备实例
 */
export const serviceGetDeviceInstancesByType = async (fastify: FastifyInstance, deviceTypeId: string) => {
    try {
        const deviceData = await readDeviceInstanceData(fastify);
        
        const devices = deviceData.devices.filter(device => device.deviceTypeId === deviceTypeId);
        
        return {
            statusCode: 200,
            message: '获取设备实例成功',
            success: true,
            data: devices
        };

    } catch (error) {
        console.error('根据设备类型获取设备实例服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '获取设备实例时发生未知错误',
            success: false,
        };
    }
};

/**
 * 获取设备实例编辑数据（包含设备实例和设备类型信息）
 */
export const serviceGetDeviceInstanceForEdit = async (fastify: FastifyInstance, deviceId: string) => {
    try {
        // 读取设备实例数据
        const deviceInstanceData = await readDeviceInstanceData(fastify);
        
        // 查找指定的设备实例
        const deviceInstance = deviceInstanceData.devices.find(device => device.id === deviceId);
        
        if (!deviceInstance) {
            return {
                statusCode: 404,
                message: '未找到指定的设备实例',
                success: false,
            };
        }

        // 获取设备类型数据
        const { serviceGetDeviceTypes } = await import('@/services/service-devices');
        const deviceTypesResult = await serviceGetDeviceTypes(fastify);
        
        if (!deviceTypesResult.success) {
            return {
                statusCode: 500,
                message: '获取设备类型列表失败',
                success: false,
            };
        }

        // 获取对应的设备类型信息
        const deviceTypes = deviceTypesResult.data || [];
        const deviceType = deviceTypes.find((type: any) => type.id === deviceInstance.deviceTypeId);

        // 构建返回数据
        const editData = {
            deviceInstance: {
                id: deviceInstance.id,
                name: deviceInstance.name,
                deviceTypeId: deviceInstance.deviceTypeId,
                conaddr: deviceInstance.conaddr?.toString() || '',
                retadd: deviceInstance.retadd?.toString() || '',
                independentPoints: deviceInstance.independentPoints || [],
                createdAt: deviceInstance.createdAt,
                updatedAt: deviceInstance.updatedAt
            },
            deviceType: deviceType ? {
                id: deviceType.id,
                name: deviceType.name,
                code: deviceType.code,
                status: deviceType.status,
                points: deviceType.points || []
            } : null,
            deviceTypes: deviceTypes.map((type: any) => ({
                id: type.id,
                name: type.name,
                code: type.code,
                status: type.status,
                points: type.points || []
            }))
        };

        return {
            statusCode: 200,
            message: '获取设备编辑数据成功',
            success: true,
            data: editData
        };

    } catch (error) {
        console.error('获取设备编辑数据服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '获取设备编辑数据时发生未知错误',
            success: false,
        };
    }
};