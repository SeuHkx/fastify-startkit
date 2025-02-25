import type {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {encrypt} from "@/utils/aes";
export default async function controllerGetAccessToken(req:FastifyRequest,reply:FastifyReply){
    const fastify:FastifyInstance = req.server;
    const hospitals:any = fastify.config.get('hospitals');
    const reportId = hospitals.reportId;
    const reportSecret = hospitals.reportSecret;
    const encryptionKey = hospitals.encryptionKey;
    const encrypted = encrypt(reportSecret, encryptionKey);
    try {
        //这里暂时进行模拟
        const serverTime = Date.now();
        const accessToken = fastify.jwt.sign(
            { userId: '123456', role: 'user' },
            { expiresIn: 120 } // 过期时间（秒）
        );
        return {
            success: true,
            code: 200,
            msg: null,
            tm: serverTime.toString(), // 服务器时间戳（字符串格式）
            data: {
                accessToken,
                expiresIn: 120, // 过期时间（秒）
            },
        };

        // const response = await fastify.axios.post('/AutoReportOpen/GetAccessToken', {
        //     reportSecret:encrypted
        // },{
        //     headers:{
        //         'Content-Type': 'application/json',
        //         'reportId':reportId
        //     }
        // });
        // return {
        //     statusCode: response.data.customCode,
        //     code: response.data.code,
        //     data: response.data.data,
        //     success: response.data.success,
        //     message: response.data.msg
        // };
    }catch(err){
        console.error('Error occurred while creating access token', err);
        return {
            statusCode: 500,
            success: false,
            message: err
        };
    }
}




