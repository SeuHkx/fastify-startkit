import path from 'path'
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../config');
import config from 'config';

export function get(key: string) {
    if (!has(key)) {
        console.warn(`This is key: ${key} environment variables not configured`)
        return null
    }
    return config.get(key)
}
export function has(key: string) {
    return config.has(key)
}