import { format } from 'date-fns';

const serviceCheckAllData = async (fastify: any, paramsArray: any[], batchSize = 20)=>{
    const results = [];
    for (let i = 0; i < paramsArray.length; i += batchSize) {
        const batch = paramsArray.slice(i, i + batchSize); // 获取当前批次的数据
        const batchResults = await fastify.prisma.$transaction(
            batch.map((params) =>
                fastify.prisma.item.update({
                    where: { id: params.id },
                    data: {
                        ...params,
                        createdAt: params.createdAt ? new Date(params.createdAt) : undefined,
                        updatedAt: new Date() // 这里更新为当前时间
                    },
                })
            )
        );
        // 格式化每条记录的时间
        results.push(
            ...batchResults.map((item:any) => ({
                ...item,
                createdAt: format(item.createdAt, 'yyyy-MM-dd HH:mm:ss'),
                updatedAt: format(item.updatedAt, 'yyyy-MM-dd HH:mm:ss'),
            }))
        );
    }
    return results;
}

export default serviceCheckAllData;