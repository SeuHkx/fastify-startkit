import { FastifyInstance } from "fastify";
import { parseDataToJson, parseJsonToData } from '@/utils/dataParser';
import fs from 'fs';

/**
 * 网络设置服务
 * @param fastify Fastify实例
 * @param params 网络设置参数
 * @returns 保存结果
 */
const serviceNetwork = async (fastify: FastifyInstance, params: { 
  macAddress: string; 
  ipAddress: string; 
  subnetMask: string; 
  gateway: string; 
}) => {
    try {
        if (!fastify.env.DATABASE_TXT || !fastify.env.DATABASE_JSON) {
            return {
                statusCode: 500,
                message: '数据库配置缺失',
                success: false,
            };
        }

        // 验证必要字段
        if (!params.macAddress || !params.ipAddress || !params.subnetMask || !params.gateway) {
            return {
                statusCode: 400,
                message: '所有网络参数都是必需的',
                success: false,
            };
        }

        // 验证IP地址格式
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipRegex.test(params.ipAddress)) {
            return {
                statusCode: 400,
                message: 'IP地址格式不正确',
                success: false,
            };
        }

        if (!ipRegex.test(params.subnetMask)) {
            return {
                statusCode: 400,
                message: '子网掩码格式不正确',
                success: false,
            };
        }

        if (!ipRegex.test(params.gateway)) {
            return {
                statusCode: 400,
                message: '网关地址格式不正确',
                success: false,
            };
        }

        // 验证MAC地址格式
        const macRegexColon = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
        const macRegexHyphen = /^([0-9A-Fa-f]{2}-){5}[0-9A-Fa-f]{2}$/;
        const macRegexDot = /^([0-9A-Fa-f]{2}\.){5}[0-9A-Fa-f]{2}$/;
        
        if (!macRegexColon.test(params.macAddress) && 
            !macRegexHyphen.test(params.macAddress) && 
            !macRegexDot.test(params.macAddress)) {
            return {
                statusCode: 400,
                message: 'MAC地址格式不正确，支持格式：XX:XX:XX:XX:XX:XX 或 XX-XX-XX-XX-XX-XX 或 XX.XX.XX.XX.XX.XX',
                success: false,
            };
        }

        // 读取当前数据
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        if (!jsonData.network) {
            jsonData.network = {};
        }

        // 更新网络设置，使用与现有数据一致的字段名
        jsonData.network = {
            mac: params.macAddress,
            ip: params.ipAddress,
            mask: params.subnetMask,
            gateway: params.gateway
        };

        // 保存更新后的数据到两种格式
        await parseJsonToData(jsonData, fastify.env.DATABASE_TXT);
        
        // 同时更新JSON文件
        await fs.promises.writeFile(fastify.env.DATABASE_JSON, JSON.stringify(jsonData, null, 2), 'utf8');

        return {
            statusCode: 200,
            message: '网络设置保存成功',
            success: true,
            data: jsonData.network
        };

    } catch (error) {
        console.error('保存网络设置服务错误:', error);
        
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : '保存网络设置时发生未知错误',
            success: false,
        };
    }
};

export default serviceNetwork;
