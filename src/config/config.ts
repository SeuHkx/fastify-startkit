import path from 'path'
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../config');
import config from 'config';

export function get(key: string) {
    if (!has(key)) {
        console.warn(`指定 key: ${key} 未配置环境变量`)
        return null
    }
    return config.get(key)
}
export function has(key: string) {
    return config.has(key)
}