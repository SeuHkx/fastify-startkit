import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import controllerCheckFormData from "@/controllers/controller-checkFormData";
import serviceCheck from "@/services/service-check";
export default async function controllerCheck(req:FastifyRequest,reply:FastifyReply){
    const fastify:FastifyInstance =  req.server;
    const params:any = req.body;
    const hospitals:any = fastify.config.get('hospitals');
    const reportId = hospitals.reportId;
    const encryptionKey = hospitals.encryptionKey;
    const rtAuthorization = params.reportAuthorization;
    const resData = {
        message: '提交校验成功，请等待审核！',
        success:true,
        statusCode:200,
        statusText:'CNRDS平台正在审核，审核通过即可上报，请前往CNRDS平台查看审核情况。',
        data:{
            check:'REVIEWING'
        }
    }
    let formData = await controllerCheckFormData(fastify,params,reportId,encryptionKey,rtAuthorization);
    if(!formData.success){
        resData.message = '其他错误！请检查数据或者其他设置是否正确。'
        resData.statusText = formData.message + ' | ' + params.name + ' | ' + formData.data + ' | ' + formData.success;
        resData.success = false;
        resData.data.check = 'ERROR';
    }else {
        resData.statusText = formData.message + ' | ' + params.name + ' | ' + formData.data + ' | ' + formData.success;
    }
    params.check = resData.data.check;
    params.statusText = resData.statusText;
    const { reportAuthorization, ...filteredParams } = params;
    const item = await serviceCheck(fastify,filteredParams);
    resData.data = {
        ...item
    }
    reply.status(200).send(resData);
}