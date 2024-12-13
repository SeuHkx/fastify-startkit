import pm2 from 'pm2';
import {get} from "./config/config";
const app:any = get('app');
const logging:any = get('logging');

const startApp = () => {
    pm2.connect((err) => {
        if (err) {
            console.error(err);
            process.exit(2);
        }
        pm2.start({
            script: app.script,
            name:   app.name,
            output: logging.outs,
            error : logging.error,
        }, async (err) => {
            if (err) throw err;
            const logRotateProcessId:any = await getProcessId(app.name);
            console.log(`${app.name}_${logRotateProcessId}_${app.version}应用已成功启动！`);
            pm2.disconnect();
        });
    });
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

