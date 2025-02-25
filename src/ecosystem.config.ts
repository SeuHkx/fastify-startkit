import dotenv from "dotenv";
import path from "path";
dotenv.config({
    path: path.resolve(__dirname, '../.env.production')
});
const NODE_CONFIG_DIR = path.resolve(__dirname, '../config');
const LOGGING_OUTS    = path.resolve(__dirname, "../", process.env.APP_LOGGING_OUTS as string);
const LOGGING_ERROR   = path.resolve(__dirname, "../", process.env.APP_LOGGING_ERROR as string);

const app:any = {
    name  :  process.env.APP_NAME,
    script:  process.env.APP_SCRIPT,
    outs:    process.env.APP_LOGGING_OUTS,
    error:   process.env.APP_LOGGING_ERROR,
    version: process.env.APP_VERSION,
    port:    process.env.APP_PORT
}
const pm2Config = {
    apps:[
        {
            name: app.name + '_' + app.version,
            script: app.script, // 运行编译后的 JS 文件
            exec_mode: 'fork',
            instances: 1,
            watch: false,
            error_file:LOGGING_ERROR,
            out_file:LOGGING_OUTS,
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            merge_logs: true,
            env: {
                NODE_ENV: 'development',
                PORT: app.port,
                NODE_CONFIG_DIR: NODE_CONFIG_DIR
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: app.port,
                NODE_CONFIG_DIR: NODE_CONFIG_DIR
            }
        }
    ]
}
module.exports = pm2Config;
