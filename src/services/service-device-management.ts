import { FastifyInstance } from "fastify";
import { serviceGetDeviceInstances } from './service-device-instances';
import { serviceGetDeviceTypes } from './service-devices';

/**
 * 增强的设备信息接口（包含设备类型详情）
 */
interface EnhancedDeviceInstance {
    id: string;
    name: string;
    deviceTypeId: string;
    deviceTypeName?: string;
    deviceTypeCode?: string;
    deviceTypeStatus?: boolean; // 从设备类型动态获取的状态
    conaddr: string;
    retadd: string;
    customPoints?: any[]; // 自定义点位配置
    DINum?: number;
    DONum?: number;
    AINum?: number;
    points?: any[]; // 所有点位（模板 + 自定义）
    templatePoints?: any[]; // 模板点位
    createdAt: string;
    updatedAt: string;
}

/**
 * 获取增强的设备列表（包含设备类型信息）
 */
export const serviceGetEnhancedDeviceList = async (fastify: FastifyInstance) => {
    try {
        // 获取设备实例列表
        const deviceInstancesResult = await serviceGetDeviceInstances(fastify);
        if (!deviceInstancesResult.success) {
            return deviceInstancesResult;
        }

        // 获取设备类型列表
        const deviceTypesResult = await serviceGetDeviceTypes(fastify);
        if (!deviceTypesResult.success) {
            return deviceTypesResult;
        }

        const deviceInstances = deviceInstancesResult.data || [];
        const deviceTypes = deviceTypesResult.data || [];

        // 创建设备类型映射
        const deviceTypeMap = new Map();
        deviceTypes.forEach((type: any) => {
            deviceTypeMap.set(type.id, type);
        });

        // 增强设备实例信息
        const enhancedDevices: EnhancedDeviceInstance[] = deviceInstances.map((device: any) => {
            const deviceType = deviceTypeMap.get(device.deviceTypeId);
            
            // 合并模板点位和自定义点位
            const templatePoints = deviceType?.points || [];
            const customPoints = device.customPoints || [];
            const allPoints = [...templatePoints, ...customPoints];
            
            return {
                ...device,
                deviceTypeName: deviceType?.name || '未知类型',
                deviceTypeCode: deviceType?.code || '',
                deviceTypeStatus: deviceType?.status || false, // 直接使用设备类型的状态
                DINum: allPoints.filter((p: any) => p.type === 'DI').length || 0,
                DONum: allPoints.filter((p: any) => p.type === 'DO').length || 0,
                AINum: allPoints.filter((p: any) => p.type === 'AI').length || 0,
                points: allPoints,
                templatePoints: templatePoints, // 模板点位
                customPoints: customPoints // 自定义点位
            };
        });

        return {
            statusCode: 200,
            message: '获取增强设备列表成功',
            success: true,
            data: enhancedDevices
        };

    } catch (error) {
        console.error('获取增强设备列表服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '获取增强设备列表时发生未知错误',
            success: false,
        };
    }
};