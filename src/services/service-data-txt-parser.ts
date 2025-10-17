import { FastifyInstance } from "fastify";
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * data.txt 解析服务
 * 将 data.txt 格式转换为 data.json、devices-type-data.json 和 devices.json
 */

// 用户信息接口
interface UserInfo {
    username: string;
    password: string;
}

// 网络配置接口
interface NetworkConfig {
    mac: string;
    ip: string;
    mask: string;
    gateway: string;
}

// 设备配置接口
interface DeviceConfig {
    name: string;
    type: string;
    DINum: number;
    DONum: number;
    AINum: number;
    conaddr: number | string;
    retadd: number | string;
}

// 数字输入配置接口
interface DigitalInputConfig {
    channel: string;
    device: string;
    status: number | string;
}

// 数字输出配置接口
interface DigitalOutputConfig {
    channel: string;
    device: string;
    action: number | string;
}

// 模拟输入配置接口
interface AnalogInputConfig {
    channel: string;
    device: string;
    status: string;
}

// 获取文件路径
const getDataTxtPath = (fastify: FastifyInstance): string => {
    const envPath = fastify.env.DATA_TXT_PATH;
    if (envPath) {
        return path.resolve(process.cwd(), envPath);
    }
    return path.join(process.cwd(), 'public/data/data.txt');
};

const getDataJsonPath = (fastify: FastifyInstance): string => {
    const envPath = fastify.env.DATA_JSON_PATH;
    if (envPath) {
        return path.resolve(process.cwd(), envPath);
    }
    return path.join(process.cwd(), 'public/data/data.json');
};

const getDeviceTypeDataPath = (fastify: FastifyInstance): string => {
    const envPath = fastify.env.DEVICE_TYPE_DATA_PATH;
    if (envPath) {
        return path.resolve(process.cwd(), envPath);
    }
    return path.join(process.cwd(), 'public/data/devices-type-data.json');
};

const getDeviceInstanceDataPath = (fastify: FastifyInstance): string => {
    const envPath = fastify.env.DEVICE_DATA;
    if (envPath) {
        return path.resolve(process.cwd(), envPath);
    }
    return path.join(process.cwd(), 'public/data/devices.json');
};

/**
 * 解析用户信息
 */
const parseUserInfo = (line: string): UserInfo | null => {
    const match = line.match(/<u>\[username=([^;]+);password=([^;]+);\]<\/u>/);
    if (match) {
        return {
            username: match[1],
            password: match[2]
        };
    }
    return null;
};

/**
 * 解析网络配置
 */
const parseNetworkConfig = (line: string): NetworkConfig | null => {
    const match = line.match(/<net>\[mac=([^;]+);ip=([^;]+);mask=([^;]+);gw=([^;]+);\]<\/net>/);
    if (match) {
        return {
            mac: match[1],
            ip: match[2],
            mask: match[3],
            gateway: match[4]
        };
    }
    return null;
};

/**
 * 解析设备配置
 */
const parseDeviceConfig = (line: string): DeviceConfig | null => {
    const match = line.match(/\[name=([^;]+);type=([^;]+);DINum=([^;]+);DONum=([^;]+);AINum=([^;]+);conaddr=([^;]+);retadd=([^;]+);\]/);
    if (match) {
        return {
            name: match[1],
            type: match[2],
            DINum: parseInt(match[3]) || 0,
            DONum: parseInt(match[4]) || 0,
            AINum: parseInt(match[5]) || 0,
            conaddr: isNaN(parseInt(match[6])) ? match[6] : parseInt(match[6]),
            retadd: isNaN(parseInt(match[7])) ? match[7] : parseInt(match[7])
        };
    }
    return null;
};

/**
 * 解析数字输入配置
 */
const parseDigitalInput = (line: string): DigitalInputConfig | null => {
    const match = line.match(/<(DI\d+)>\[devname=([^;]*);status=([^;]*);\]<\/DI\d+>/);
    if (match) {
        return {
            channel: match[1],
            device: match[2],
            status: isNaN(parseInt(match[3])) ? match[3] : parseInt(match[3])
        };
    }
    return null;
};

/**
 * 解析数字输出配置
 */
const parseDigitalOutput = (line: string): DigitalOutputConfig | null => {
    const match = line.match(/<(DO\d+)>\[devname=([^;]*);action=([^;]*);\]<\/DO\d+>/);
    if (match) {
        return {
            channel: match[1],
            device: match[2],
            action: isNaN(parseInt(match[3])) ? match[3] : parseInt(match[3])
        };
    }
    return null;
};

/**
 * 解析模拟输入配置
 */
const parseAnalogInput = (line: string): AnalogInputConfig | null => {
    const match = line.match(/<(AI\d+)>\[devname=([^;]*);status=([^;]*);\]<\/AI\d+>/);
    if (match) {
        return {
            channel: match[1],
            device: match[2],
            status: match[3]
        };
    }
    return null;
};

/**
 * 生成设备类型数据
 */
const generateDeviceTypeData = (devices: DeviceConfig[]): any => {
    const deviceTypeMap = new Map<string, any>();

    devices.forEach(device => {
        if (!deviceTypeMap.has(device.type)) {
            deviceTypeMap.set(device.type, {
                id: uuidv4(),
                name: device.type,
                code: device.type,
                status: true,
                points: []
            });
        }
    });

    return {
        devices: Array.from(deviceTypeMap.values()),
        lastUpdated: new Date().toISOString()
    };
};

/**
 * 生成设备实例数据
 */
const generateDeviceInstanceData = (
    devices: DeviceConfig[], 
    deviceTypeData: any,
    digitalInputs: DigitalInputConfig[],
    digitalOutputs: DigitalOutputConfig[],
    analogInputs: AnalogInputConfig[]
): any => {
    const deviceTypeMap = new Map<string, string>();
    deviceTypeData.devices.forEach((type: any) => {
        deviceTypeMap.set(type.code, type.id);
    });

    const deviceInstances = devices.map(device => {
        const deviceTypeId = deviceTypeMap.get(device.type) || uuidv4();
        
        // 为该设备生成自定义点位
        const customPoints: any[] = [];
        
        // 添加DI点位
        const deviceDIs = digitalInputs.filter(di => di.device === device.name);
        deviceDIs.forEach(di => {
            customPoints.push({
                id: Date.now() + Math.random(),
                type: 'DI',
                code: '',
                statusCode: di.channel,
                statusFeedback: '',
                value: 0,
                status: di.status,
                action: '',
                channel: di.channel,
                isFromTemplate: false
            });
        });

        // 添加DO点位
        const deviceDOs = digitalOutputs.filter(do_ => do_.device === device.name);
        deviceDOs.forEach(do_ => {
            customPoints.push({
                id: Date.now() + Math.random(),
                type: 'DO',
                code: '',
                statusCode: do_.channel,
                statusFeedback: '',
                value: 0,
                status: '',
                action: do_.action,
                channel: do_.channel,
                isFromTemplate: false
            });
        });

        // 添加AI点位
        const deviceAIs = analogInputs.filter(ai => ai.device === device.name);
        deviceAIs.forEach(ai => {
            customPoints.push({
                id: Date.now() + Math.random(),
                type: 'AI',
                code: '',
                statusCode: ai.channel,
                statusFeedback: ai.status,
                value: 0,
                status: '',
                action: '',
                channel: ai.channel,
                isFromTemplate: false
            });
        });

        return {
            id: uuidv4(),
            name: device.name,
            deviceID: device.name, // 使用设备名称作为设备ID
            deviceTypeId,
            conaddr: device.conaddr.toString(),
            retadd: device.retadd.toString(),
            customPoints,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    });

    return {
        devices: deviceInstances,
        lastUpdated: new Date().toISOString()
    };
};

/**
 * 主要的解析和转换服务
 */
export const serviceParseDataTxtToJson = async (fastify: FastifyInstance) => {
    try {
        console.log('[DataTxtParser] 开始解析 data.txt 文件');

        const dataPath = getDataTxtPath(fastify);
        
        // 读取 data.txt 文件
        const content = await fs.promises.readFile(dataPath, 'utf8');
        const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        let userInfo: UserInfo | null = null;
        let networkConfig: NetworkConfig | null = null;
        const devices: DeviceConfig[] = [];
        const digitalInputs: DigitalInputConfig[] = [];
        const digitalOutputs: DigitalOutputConfig[] = [];
        const analogInputs: AnalogInputConfig[] = [];

        // 逐行解析
        let isInDeviceSection = false;
        
        for (const line of lines) {
            // 解析用户信息
            if (line.includes('<u>')) {
                userInfo = parseUserInfo(line);
                continue;
            }

            // 解析网络配置
            if (line.includes('<net>')) {
                networkConfig = parseNetworkConfig(line);
                continue;
            }

            // 解析设备配置
            if (line.includes('<dev>')) {
                isInDeviceSection = true;
                // 如果这一行本身包含设备配置，也要解析
                const device = parseDeviceConfig(line);
                if (device) {
                    devices.push(device);
                }
                continue;
            }

            if (line.includes('</dev>')) {
                isInDeviceSection = false;
                continue;
            }

            // 如果在设备配置段内，解析设备配置
            if (isInDeviceSection) {
                const device = parseDeviceConfig(line);
                if (device) {
                    devices.push(device);
                }
                continue;
            }

            // 解析数字输入
            if (line.includes('<DI')) {
                const di = parseDigitalInput(line);
                if (di) {
                    digitalInputs.push(di);
                }
                continue;
            }

            // 解析数字输出
            if (line.includes('<DO')) {
                const do_ = parseDigitalOutput(line);
                if (do_) {
                    digitalOutputs.push(do_);
                }
                continue;
            }

            // 解析模拟输入
            if (line.includes('<AI')) {
                const ai = parseAnalogInput(line);
                if (ai) {
                    analogInputs.push(ai);
                }
                continue;
            }
        }

        console.log('[DataTxtParser] 解析完成:', {
            userInfo: !!userInfo,
            networkConfig: !!networkConfig,
            devicesCount: devices.length,
            digitalInputsCount: digitalInputs.length,
            digitalOutputsCount: digitalOutputs.length,
            analogInputsCount: analogInputs.length
        });

        // 生成 data.json
        const dataJson: any = {
            devices,
            digitalInputs,
            digitalOutputs,
            analogInputs
        };

        // 只有解析到用户信息时才添加
        if (userInfo) {
            dataJson.user = userInfo;
        }

        // 只有解析到网络配置时才添加
        if (networkConfig) {
            dataJson.network = networkConfig;
        }

        // 生成设备类型数据
        const deviceTypeData = generateDeviceTypeData(devices);

        // 生成设备实例数据
        const deviceInstanceData = generateDeviceInstanceData(
            devices, 
            deviceTypeData, 
            digitalInputs, 
            digitalOutputs, 
            analogInputs
        );

        // 保存文件
        const dataJsonPath = getDataJsonPath(fastify);
        const deviceTypeDataPath = getDeviceTypeDataPath(fastify);
        const deviceInstanceDataPath = getDeviceInstanceDataPath(fastify);

        // 确保目录存在
        await fs.promises.mkdir(path.dirname(dataJsonPath), { recursive: true });
        await fs.promises.mkdir(path.dirname(deviceTypeDataPath), { recursive: true });
        await fs.promises.mkdir(path.dirname(deviceInstanceDataPath), { recursive: true });

        // 写入文件
        await fs.promises.writeFile(dataJsonPath, JSON.stringify(dataJson, null, 2), 'utf8');
        await fs.promises.writeFile(deviceTypeDataPath, JSON.stringify(deviceTypeData, null, 2), 'utf8');
        await fs.promises.writeFile(deviceInstanceDataPath, JSON.stringify(deviceInstanceData, null, 2), 'utf8');

        console.log('[DataTxtParser] 文件转换完成');

        return {
            statusCode: 200,
            message: 'data.txt 文件解析和转换成功',
            success: true,
            data: {
                dataJsonPath,
                deviceTypeDataPath,
                deviceInstanceDataPath,
                summary: {
                    devicesCount: devices.length,
                    deviceTypesCount: deviceTypeData.devices.length,
                    deviceInstancesCount: deviceInstanceData.devices.length,
                    digitalInputsCount: digitalInputs.length,
                    digitalOutputsCount: digitalOutputs.length,
                    analogInputsCount: analogInputs.length
                }
            }
        };

    } catch (error) {
        console.error('[DataTxtParser] 解析失败:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : 'data.txt 解析时发生未知错误',
            success: false,
        };
    }
};
