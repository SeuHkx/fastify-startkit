import bcrypt from "bcrypt";
import {FastifyInstance, FastifyReply} from "fastify";

const serviceLogin = async (fastify:FastifyInstance,params:any)=>{
    const user = await fastify.prisma.user.findUnique({
        where:{
            name: params.name,
        }
    });
    if (!user) {
        return {
            statusCode: 401,
            message: '用户不存在!',
            success:false,
        };
    }
    const isPasswordValid = await bcrypt.compare(params.password, user.password);
    if (!isPasswordValid) {
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
            name: user.name,
            email: user.email,
            id: user.id,
        }
    }

}
export default serviceLogin;