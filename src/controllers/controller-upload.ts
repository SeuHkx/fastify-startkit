import {FastifyRequest, FastifyReply} from 'fastify';
import serviceUpload from "@/services/service-upload";

export async function uploadController(req: FastifyRequest, reply: FastifyReply) {
    const fastify:any =  req.server;
    const data:any = await req.file();
    const {file, filename} = data;
    const chunks = [];
    for await (const chunk of file) {
        chunks.push(chunk);
    }
    const fileContent = Buffer.concat(chunks).toString('utf-8');
    try {
        let jsonData = JSON.parse(fileContent);
    } catch (err) {
        return reply.status(400).send({error: '数据格式有误!'});
    }
    let params = {
        name:filename,
        rawData:fileContent,
        statusText:'点击校验按钮或者数据校验进行校验。',
    }
    const item = await serviceUpload(fastify,params);

    reply.send({
        message: '上传数据成功！' ,
        data:{
            item
        }
    });
}
