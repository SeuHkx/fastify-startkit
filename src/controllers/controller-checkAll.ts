import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import controllerCheckFormData from "@/controllers/controller-checkFormData";
import serviceCheckAllData from "@/services/service-checkAllData";
import { Sema } from 'async-sema';

export default async function controllerCheckAll(req:FastifyRequest,reply:FastifyReply){
    const fastify:FastifyInstance =  req.server;
    const params:any = req.body;
    const hospitals:any = fastify.config.get('hospitals');
    const reportId = hospitals.reportId;
    const encryptionKey = hospitals.encryptionKey;
    const rtAuthorization = params.reportAuthorization;
    const resData = {
        message: '已批量提交校验！',
        success:true,
        statusCode:200,
        data:{
            items: [] as any[]
        }
    }
    const sema = new Sema(1);
    const delay = (ms:any) => new Promise(resolve => setTimeout(resolve, ms));
    const tasks = params.items.map(async(item:any,index: number)=>{
        await sema.acquire();
        try {
            await delay(index * 500); // 每个请求间隔 500ms
            let formData = await controllerCheckFormData(fastify, item,reportId,encryptionKey,rtAuthorization);
            return {
                ...item,
                name: item.name,
                statusText: `${formData.message} | ${item.name} | ${formData.data} | ${formData.success}`,
                check: formData.success ? 'REVIEWING' : 'ERROR'
            };
        }catch(error:any){
            console.error(`校验失败 (Item: ${item.name}): ${error.message}`);
            return {
                ...item,
                name: item.name,
                statusText: `校验异常 | ${item.name} | ${error.message}`,
                check: 'ERROR'
            };
        }finally {
            sema.release();
        }
    });
    resData.data.items = await Promise.all(tasks); // 存储校验结果
    const updateResults = await serviceCheckAllData(fastify, resData.data.items);
    resData.data = {
        items: updateResults
    };
    reply.status(200).send(resData);
}