import pm2 from 'pm2';
import { exec } from 'child_process';
import yaml from 'js-yaml';
import fs from 'fs';

const loadYamlConfig = (filePath: string) => {
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return yaml.load(fileContents);
    } catch (e) {
        console.error('Error reading YAML config:', e);
        return null;
    }
};
const config:any = loadYamlConfig('./../config.yaml');
const { app ,logging} = config;

const startApp = () => {
    pm2.connect((err) => {
        if (err) {
            console.error(err);
            process.exit(2);
        }
        pm2.start({
            script: app.script,
            name: app.name,
            output: logging.outs,
            error : logging.error,
        }, async (err) => {
            if (err) throw err;
            console.log(`${app.name}应用已通过 PM2 启动`);

            const logRotateProcessId:any = await getProcessId(app.name);
            //await configureLogRotate(logRotateProcessId);
            pm2.disconnect();
        });
    });
};
const configureLogRotate = async (processId:number) => {
    const commands = ['pm2 set pm2-logrotate:max_size 10M', 'pm2 set pm2-logrotate:retain 10', 'pm2 set pm2-logrotate:compress true', 'pm2 set pm2-logrotate:rotateInterval 1d',];
    const commandPromises = commands.map(command => {
        return new Promise((resolve:any, reject:any) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`执行命令失败: ${error}`);
                    reject(error);
                    return;
                }
                console.log(`命令输出: ${stdout}`);
                if (stderr) {
                    console.error(`命令错误输出: ${stderr}`);
                }
                resolve();
            });
        });
    });
    try {
        await Promise.all(commandPromises); // 等待所有命令执行完成
        console.log('所有命令已成功执行');
    } catch (err) {
        console.error('配置过程中出现错误', err);
    } finally {
        pm2.disconnect(); // 断开连接
        console.log('PM2 连接已断开');
    }
};
const getProcessId = async (processName:string) => {
    return new Promise((resolve, reject) => {
        pm2.list((err, list) => {
            if (err) {
                reject(err);
            } else {
                const processInfo = list.find(p => p.name === processName);
                resolve(processInfo ? processInfo.pm_id : null);
            }
        });
    });
};
startApp();

