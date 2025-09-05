import dotenv from "dotenv";
import path from "path";

// Load production env but keep running even if file is missing
dotenv.config({
    path: path.resolve(__dirname, '../.env.production')
});

// Safe defaults
const CWD = path.resolve(__dirname, '..'); // points to app/
const APP_NAME = process.env.APP_NAME || 'app';
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const APP_PORT = process.env.APP_PORT || '3000';
const APP_SCRIPT = process.env.APP_SCRIPT || 'bin/server.js';

const NODE_CONFIG_DIR = path.resolve(CWD, 'config');
const LOGGING_OUTS  = path.resolve(CWD, process.env.APP_LOGGING_OUTS  || 'logs/outs/outs.log');
const LOGGING_ERROR = path.resolve(CWD, process.env.APP_LOGGING_ERROR || 'logs/error/error.log');

const app:any = {
    name  :  APP_NAME,
    script:  APP_SCRIPT,
    outs:    LOGGING_OUTS,
    error:   LOGGING_ERROR,
    version: APP_VERSION,
    port:    APP_PORT
}

const pm2Config = {
    apps:[
        {
            name: app.name + '_' + app.version,
            script: app.script, // 运行编译后的 JS 文件
            exec_mode: 'fork',
            instances: 1,
            watch: false,
            cwd: CWD,
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
