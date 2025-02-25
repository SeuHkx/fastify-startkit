import { format } from 'date-fns';
const serviceUpload = async (fastify:any, params:any)=>{
    const item = await fastify.prisma.item.create({
        data: {
            ...params
        }
    });
    return{
        ...item,
        createdAt: format(item.createdAt,'yyyy-MM-dd HH:mm:ss'),
        updatedAt: format(item.updatedAt,'yyyy-MM-dd HH:mm:ss'),
    };
}
export default serviceUpload;