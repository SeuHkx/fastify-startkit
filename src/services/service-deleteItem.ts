import { format } from 'date-fns';
const serviceDeleteItem = async (fastify:any,params:any)=>{
    const { ids } = params;

    if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('无效的请求参数，ids 必须是一个非空数组');
    }
    if (ids.length === 1) {
        const item = await fastify.prisma.item.delete({
            where: {
                id: ids[0],
            },
        });
        const totalItems = await fastify.prisma.item.count();
        return{
            ...item,
            total: totalItems,
            createdAt: format(item.createdAt,'yyyy-MM-dd HH:mm:ss'),
            updatedAt: format(item.updatedAt,'yyyy-MM-dd HH:mm:ss'),
        };
    }else{
        const items = await fastify.prisma.item.findMany({
            where: {
                id: {
                    in: ids,
                },
            },
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        const deletedItems = await fastify.prisma.item.deleteMany({
            where: {
                id: {
                    in: ids,
                },
            },
        });
        const totalItems = await fastify.prisma.item.count();
        const formattedItems = items.map((item:any) => ({
            id: item.id,
            createdAt: format(item.createdAt, 'yyyy-MM-dd HH:mm:ss'),
            updatedAt: format(item.updatedAt, 'yyyy-MM-dd HH:mm:ss'),
        }));
        return {
            deletedCount: deletedItems.count,
            total: totalItems,
            deletedItems: formattedItems,
        };
    }

}
export default serviceDeleteItem;