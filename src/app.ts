import pm2 from 'pm2';
import yaml from 'js-yaml';
import fs from 'fs';
import config from 'config';
const loadYamlConfig = (filePath: string) => {
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return yaml.load(fileContents);
    } catch (e) {
        console.error('Error reading YAML config:', e);
        return null;
    }
};
//const config:any = loadYamlConfig('./../config.yaml');
const app:any = config.get('app');
const logging:any = config.get('logging');

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

