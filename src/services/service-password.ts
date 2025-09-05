import { FastifyInstance } from "fastify";
import { parseDataToJson, parseJsonToData } from '@/utils/dataParser';
import fs from 'fs';

/**
 * 修改密码服务
 * @param fastify Fastify实例
 * @param params 新密码参数
 * @returns 修改结果
 */
const servicePassword = async (fastify: FastifyInstance, params: { newPassword: string }) => {
    try {
        if (!fastify.env.DATABASE_TXT || !fastify.env.DATABASE_JSON) {
            return {
                statusCode: 500,
                message: '数据库配置缺失',
                success: false,
            };
        }

        // 验证新密码
        if (!params.newPassword) {
            return {
                statusCode: 400,
                message: '新密码不能为空',
                success: false,
            };
        }

        if (params.newPassword.length < 6) {
            return {
                statusCode: 400,
                message: '新密码长度至少6位',
                success: false,
            };
        }
        // 读取当前数据
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT, fastify.env.DATABASE_JSON);
        
        if (!jsonData.user) {
            return {
                statusCode: 500,
                message: '用户数据不存在',
                success: false,
            };
        }

        // 更新密码
        jsonData.user.password = params.newPassword;
        // 保存更新后的数据到两种格式
        try {
            // 更新JSON文件
            fs.writeFileSync(fastify.env.DATABASE_JSON, JSON.stringify(jsonData, null, 2), 'utf-8');
            // 更新TXT文件
            await parseJsonToData(jsonData, fastify.env.DATABASE_TXT);
            
            return {
                statusCode: 200,
                message: '密码修改成功',
                success: true,
            };
        } catch (saveError) {

            return {
                statusCode: 500,
                message: '保存密码失败，已恢复原始数据',
                success: false,
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            message: '修改密码服务异常: ' + (error instanceof Error ? error.message : String(error)),
            success: false,
        };
    }
};

export default servicePassword;
