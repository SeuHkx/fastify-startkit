import { format } from 'date-fns';
const serviceFindItems = async (fastify:any, params:any)=>{
    const where: any = {};
    if (params.check !== undefined) {
        where.check = params.check;
    }
    if (params.report !== undefined) {
        where.report = params.report; // 假设 report 是直接匹配的值
    }
    const items = await fastify.prisma.item.findMany({
        where,
        take: parseInt(params.pageSize),
        skip: (parseInt(params.page) - 1) * parseInt(params.pageSize),
        orderBy: {
            updatedAt: 'desc',
        },
    });
    const totalItems = await fastify.prisma.item.count({
        where
    });
    return {
        total: totalItems,
        page: parseInt(params.page),
        pageSize: parseInt(params.pageSize),
        totalPages: Math.ceil(totalItems / params.pageSize),
        items: items.map((item:any) => ({
            ...item,
            createdAt: format(item.createdAt,'yyyy-MM-dd HH:mm:ss'),
            updatedAt: format(item.updatedAt,'yyyy-MM-dd HH:mm:ss')
        }))
    }
}
export default serviceFindItems;