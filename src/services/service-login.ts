import {FastifyInstance, FastifyReply} from "fastify";
import { parseDataToJson } from '@/utils/dataParser';

const serviceLogin = async (fastify:FastifyInstance,params:any)=>{
    // 使用固定ID
    const fixedId = "user123456";
    try {
        if (!fastify.env.DATABASE_TXT || !fastify.env.DATABASE_JSON) {
            return {
                statusCode: 500,
                message: '数据库配置缺失',
                success: false,
            };
        }
        const jsonData = await parseDataToJson(fastify.env.DATABASE_TXT,fastify.env.DATABASE_JSON);
        const user = jsonData.user;
        
        if (!user) {
            return {
                statusCode: 401,
                message: '用户不存在!',
                success:false,
            };
        }
        
        // 验证用户名（如果提供了的话）
        if (params.name && String(user.username) !== String(params.name)) {
            return {
                statusCode: 401,
                message: '用户名不正确!',
                success:false,
            };
        }
        
        // 验证密码 - 将两个值都转换为字符串进行比较，避免类型不匹配问题
        const userPassword = String(user.password);
        const inputPassword = String(params.password);
        
        if (userPassword !== inputPassword) {
            return {
                statusCode: 401,
                message: '密码不正确!',
                success:false,
            };
        }
        
        return {
            statusCode: 200,
            message:'登录成功',
            success:true,
            data:{
                id: fixedId,
                name: params.name || user.username, // 如果没有提供name，使用用户名
            }
        }
    } catch (error) {
        return {
            statusCode: 500,
            message: '登录服务异常: ' + (error instanceof Error ? error.message : String(error)),
            success: false,
        };
    }
}
export default serviceLogin;