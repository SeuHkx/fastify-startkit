import type {FastifyInstance} from "fastify";
import CNRDSForms from "@/utils/CNRDSForms";
import {encrypt,decrypt} from "@/utils/aes";
function filterAndCheckDiscrepancies(data:any, tableNames:any) {
    const discrepancies:any = [];
    data.list = data.list.filter((item:any) => {
        const expectedJson = tableNames[item.formKey];
        if (expectedJson) {
            const originalJson = item.json
            const expectedJsonParsed = expectedJson;
            // 找出不一致的字段
            const differences = Object.keys(expectedJsonParsed).filter(key =>
                originalJson[key] !== expectedJsonParsed[key]
            );
            // 如果有不一致，记录下来
            if (differences.length > 0) {
                discrepancies.push({
                    formKey: item.formKey,
                    differences: differences.map(key => ({
                        key: key,
                        expected: expectedJsonParsed[key],
                        actual: originalJson[key]
                    }))
                });
            }
            // 返回所有匹配的项
            return true;
        }
        return false;
    });
    return {
        filteredList: data,
        discrepancies: discrepancies
    };
}
export default async function controllerCheckFormData(fastify: FastifyInstance,params:any,reportId:any,encryptionKey:any,reportAuthorization:any) {
    let reportData = JSON.parse(params.rawData);
    const result = filterAndCheckDiscrepancies(reportData,CNRDSForms);
    const encrypted = encrypt(JSON.stringify(result.filteredList), encryptionKey);
    try {
        const response = await fastify.axios.post('/AutoReportOpen/CheckFormData', {
            data: encrypted
        },{
            headers:{
                'Content-Type': 'application/json',
                'reportId':reportId,
                'reportAuthorization':reportAuthorization
            }
        });
        return {
            statusCode: response.data.customCode,
            success: response.data.success,
            code: response.data.code,
            message: response.data.msg,
            data: response.data.data,
        }
    }catch (error:any) {
        let errorMessage = '请求失败';
        let statusCode = 500;

        // 处理 Axios 请求错误
        if (error.response) {
            // 服务器返回了错误状态码
            statusCode = error.response.status;
            errorMessage = `服务器错误: ${error.response.status} ${error.response.statusText}`;

            // 服务器返回的详细错误信息
            if (error.response.data && error.response.data.msg) {
                errorMessage += ` - ${error.response.data.msg}`;
            }
        } else if (error.request) {
            // 请求已发送，但没有收到响应（可能是网络问题）
            errorMessage = '请求已发送，但未收到服务器响应，请检查网络';
        } else {
            // 其他错误（如代码错误）
            errorMessage = `请求出错: ${error.message}`;
        }
        // 返回详细的错误信息
        return {
            success: false,
            statusCode: statusCode,
            message: errorMessage
        };
    }
}