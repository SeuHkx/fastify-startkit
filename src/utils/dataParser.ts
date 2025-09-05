import fs from 'fs';
import path from 'path';

/**
 * 数据解析器 - 将硬件配置文本格式转换为JSON格式
 */
export class DataParser {
  /**
   * 解析标签内容，提取键值对
   * @param content 标签内容 例如：[username=admin;password=admin;]
   * @returns 解析后的对象
   */
  private static parseTagContent(content: string): Record<string, string | number> {
    const result: Record<string, string | number> = {};
    
    // 移除方括号并按分号分割
    const cleanContent = content.replace(/^\[|\]$/g, '');
    const pairs = cleanContent.split(';').filter(pair => pair.trim());
    
    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        
        // 对于密码字段，始终保持为字符串类型，避免类型转换问题
        if (trimmedKey === 'password' || trimmedKey === 'pass') {
          result[trimmedKey] = trimmedValue;
        } else {
          // 尝试转换为数字，如果失败则保持字符串
          const numValue = Number(trimmedValue);
          result[trimmedKey] = isNaN(numValue) ? trimmedValue : numValue;
        }
      }
    });
    
    return result;
  }

  /**
   * 解析用户信息
   * @param line 用户信息行
   * @returns 用户信息对象
   */
  private static parseUser(line: string): { username: string; password: string } {
    const match = line.match(/<u>\[(.*?)\]<\/u>/);
    if (!match) throw new Error('Invalid user format');
    
    const parsed = this.parseTagContent(`[${match[1]}]`);
    return {
      username: parsed.username as string,
      password: parsed.password as string
    };
  }

  /**
   * 解析网络配置
   * @param line 网络配置行
   * @returns 网络配置对象
   */
  private static parseNetwork(line: string): { mac: string; ip: string; mask: string; gateway: string } {
    const match = line.match(/<net>\[(.*?)\]<\/net>/);
    if (!match) throw new Error('Invalid network format');
    
    const parsed = this.parseTagContent(`[${match[1]}]`);
    return {
      mac: parsed.mac as string,
      ip: parsed.ip as string,
      mask: parsed.mask as string,
      gateway: parsed.gw as string
    };
  }

  /**
   * 解析设备配置
   * @param line 设备配置行
   * @returns 设备配置数组
   */
  private static parseDevices(line: string): Array<{ name: string; type: string; DINum: number; DONum: number }> {
    const match = line.match(/<dev>(.*?)<\/dev>/);
    if (!match) throw new Error('Invalid device format');
    
    const devices: Array<{ name: string; type: string; DINum: number; DONum: number }> = [];
    const deviceMatches = match[1].match(/\[[^\]]+\]/g);
    
    if (deviceMatches) {
      deviceMatches.forEach(deviceMatch => {
        const parsed = this.parseTagContent(deviceMatch);
        devices.push({
          name: parsed.name as string,
          type: parsed.type as string,
          DINum: parsed.DINum as number,
          DONum: parsed.DONum as number
        });
      });
    }
    
    return devices;
  }

  /**
   * 解析数字输入/输出
   * @param line 数字IO行
   * @returns 数字IO对象
   */
  private static parseDigitalIO(line: string): { channel: string; device: string; status?: number; action?: number } {
    const channelMatch = line.match(/<(DI\d+|DO\d+)>\[(.*?)\]<\/\1>/);
    if (!channelMatch) throw new Error('Invalid digital IO format');
    
    const channel = channelMatch[1];
    const parsed = this.parseTagContent(`[${channelMatch[2]}]`);
    
    const result: { channel: string; device: string; status?: number; action?: number } = {
      channel,
      device: parsed.dev as string
    };
    
    if (parsed.sta !== undefined) {
      result.status = parsed.sta as number;
    }
    if (parsed.action !== undefined) {
      result.action = parsed.action as number;
    }
    
    return result;
  }

  /**
   * 解析模拟输入
   * @param line 模拟输入行
   * @returns 模拟输入对象
   */
  private static parseAnalogInput(line: string): { channel: string; device: string; status: string } {
    const channelMatch = line.match(/<(AI\d+)>\[(.*?)\](?:<\/AI>|<\/AI\d+>)?/);
    if (!channelMatch) throw new Error('Invalid analog input format');
    
    const channel = channelMatch[1];
    const parsed = this.parseTagContent(`[${channelMatch[2]}]`);
    
    return {
      channel,
      device: parsed.dev as string,
      status: parsed.sta as string
    };
  }

  /**
   * 将data.txt格式转换为JSON格式
   * @param inputPath 输入文件路径
   * @param outputPath 输出文件路径（可选）
   * @returns 转换后的JSON对象
   */
  static async convertToJson(inputPath: string, outputPath?: string): Promise<any> {
    try {
      // 读取文件内容
      const content = fs.readFileSync(inputPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const result: any = {
        user: null,
        network: null,
        devices: [],
        digitalInputs: [],
        digitalOutputs: [],
        analogInputs: []
      };
      
      // 逐行解析
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        try {
          if (trimmedLine.startsWith('<u>')) {
            result.user = this.parseUser(trimmedLine);
          } else if (trimmedLine.startsWith('<net>')) {
            result.network = this.parseNetwork(trimmedLine);
          } else if (trimmedLine.startsWith('<dev>')) {
            result.devices = this.parseDevices(trimmedLine);
          } else if (trimmedLine.match(/^<DI\d+>/)) {
            const digitalInput = this.parseDigitalIO(trimmedLine);
            result.digitalInputs.push(digitalInput);
          } else if (trimmedLine.match(/^<DO\d+>/)) {
            const digitalOutput = this.parseDigitalIO(trimmedLine);
            result.digitalOutputs.push(digitalOutput);
          } else if (trimmedLine.match(/^<AI\d+>/)) {
            const analogInput = this.parseAnalogInput(trimmedLine);
            result.analogInputs.push(analogInput);
          }
        } catch (error) {
          console.warn(`Warning: Failed to parse line: ${trimmedLine}`, error);
        }
      }
      
      // 如果指定了输出路径，写入文件
      if (outputPath) {
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
        console.log(`JSON file saved to: ${outputPath}`);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to convert data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 将JSON格式转换回data.txt格式
   * @param jsonData JSON数据对象
   * @param outputPath 输出文件路径（可选）
   * @returns 转换后的文本内容
   */
  static async convertToText(jsonData: any, outputPath?: string): Promise<string> {
    try {
      const lines: string[] = [];
      
      // 用户信息
      if (jsonData.user) {
        const userLine = `<u>[username=${jsonData.user.username};password=${jsonData.user.password};]</u>`;
        lines.push(userLine);
      }
      
      // 网络配置
      if (jsonData.network) {
        const netLine = `<net>[mac=${jsonData.network.mac};ip=${jsonData.network.ip};mask=${jsonData.network.mask};gw=${jsonData.network.gateway};]</net>`;
        lines.push(netLine);
      }
      
      // 设备配置
      if (jsonData.devices && jsonData.devices.length > 0) {
        const deviceParts = jsonData.devices.map((device: any) => 
          `[name=${device.name};type=${device.type};DINum=${device.DINum};DONum=${device.DONum};]`
        );
        const devLine = `<dev>${deviceParts.join('')}</dev>`;
        lines.push(devLine);
      }
      
      // 数字输入
      if (jsonData.digitalInputs) {
        jsonData.digitalInputs.forEach((di: any) => {
          const diLine = `<${di.channel}>[dev=${di.device};sta=${di.status}]</${di.channel}>`;
          lines.push(diLine);
        });
      }
      
      // 数字输出
      if (jsonData.digitalOutputs) {
        jsonData.digitalOutputs.forEach((do_: any) => {
          const doLine = `<${do_.channel}>[dev=${do_.device};action=${do_.action}]</${do_.channel}>`;
          lines.push(doLine);
        });
      }
      
      // 模拟输入
      if (jsonData.analogInputs) {
        jsonData.analogInputs.forEach((ai: any) => {
          const aiLine = `<${ai.channel}>[dev=${ai.device};sta=${ai.status}]</AI>`;
          lines.push(aiLine);
        });
      }
      
      const result = lines.join('\n');
      
      // 如果指定了输出路径，写入文件
      if (outputPath) {
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, result, 'utf-8');
        console.log(`Text file saved to: ${outputPath}`);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to convert JSON to text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * 便捷函数：将data.txt转换为JSON
 * @param inputPath 输入文件路径
 * @param outputPath 输出文件路径（可选）
 * @returns Promise<JSON对象>
 */
export const parseDataToJson = async (inputPath: string, outputPath?: string) => {
  return DataParser.convertToJson(inputPath, outputPath);
};

/**
 * 便捷函数：将JSON转换为data.txt格式
 * @param jsonData JSON数据对象
 * @param outputPath 输出文件路径（可选）
 * @returns Promise<文本内容>
 */
export const parseJsonToData = async (jsonData: any, outputPath?: string) => {
  return DataParser.convertToText(jsonData, outputPath);
};
