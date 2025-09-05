# 数据解析器工具 (DataParser)

这个工具用于在硬件配置的文本格式和 JSON 格式之间进行转换。

## 功能特性

- 🔄 双向转换：支持 text ↔ JSON 格式转换
- 📝 完整解析：支持用户信息、网络配置、设备配置、数字IO、模拟输入等
- 🛡️ 错误处理：对格式错误有良好的容错能力
- 📁 文件操作：支持文件读写和内存操作
- 🎯 类型安全：完整的 TypeScript 类型定义

## 支持的数据格式

### 输入格式 (data.txt)
```
<u>[username=admin;password=admin;]</u>
<net>[mac=00.07.ce.aa.bc.cc;ip=192.168.1.55;mask=255.255.255.0;gw=192.168.1.1;]</net>
<dev>[name=chezhi1;type=CZ;DINum=6;DONum=4;][name=ZM1;type=ZM;DINum=1;DONum=1;]</dev>
<DI0>[dev=chezhi1;sta=1]</DI0>
<DO0>[dev=chezhi1;action=1]</DO0>
<AI1>[dev=COVI1;sta=CO]</AI>
```

### 输出格式 (JSON)
```json
{
  "user": {
    "username": "admin",
    "password": "admin"
  },
  "network": {
    "mac": "00.07.ce.aa.bc.cc",
    "ip": "192.168.1.55",
    "mask": "255.255.255.0",
    "gateway": "192.168.1.1"
  },
  "devices": [
    {
      "name": "chezhi1",
      "type": "CZ",
      "DINum": 6,
      "DONum": 4
    }
  ],
  "digitalInputs": [
    {
      "channel": "DI0",
      "device": "chezhi1",
      "status": 1
    }
  ],
  "digitalOutputs": [
    {
      "channel": "DO0",
      "device": "chezhi1",
      "action": 1
    }
  ],
  "analogInputs": [
    {
      "channel": "AI1",
      "device": "COVI1",
      "status": "CO"
    }
  ]
}
```

## 使用方法

### 方法1：使用便捷函数

```typescript
import { parseDataToJson, parseJsonToData } from './utils/dataParser';

// 将 data.txt 转换为 JSON
const jsonData = await parseDataToJson('data/data.txt', 'data/output.json');

// 将 JSON 转换为 data.txt 格式
const textData = await parseJsonToData(jsonData, 'data/output.txt');
```

### 方法2：使用 DataParser 类

```typescript
import { DataParser } from './utils/dataParser';

// 转换为 JSON（带文件保存）
const jsonData = await DataParser.convertToJson('data/data.txt', 'data/output.json');

// 转换为 JSON（仅内存操作）
const jsonData = await DataParser.convertToJson('data/data.txt');

// 转换为文本格式
const textData = await DataParser.convertToText(jsonData, 'data/output.txt');
```

### 方法3：在服务中使用

```typescript
import { DataParser } from './utils';

// 在控制器中使用
export const parseConfigFile = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const inputPath = req.body.inputPath;
    const result = await DataParser.convertToJson(inputPath);
    
    reply.send({
      success: true,
      data: result
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message
    });
  }
};
```

## API 参考

### DataParser.convertToJson(inputPath, outputPath?)

将文本格式转换为 JSON 格式

**参数：**
- `inputPath` (string): 输入文件路径
- `outputPath` (string, 可选): 输出文件路径，如果不提供则仅返回数据

**返回：** Promise<any> - 解析后的 JSON 对象

### DataParser.convertToText(jsonData, outputPath?)

将 JSON 格式转换为文本格式

**参数：**
- `jsonData` (any): 要转换的 JSON 数据
- `outputPath` (string, 可选): 输出文件路径，如果不提供则仅返回文本

**返回：** Promise<string> - 转换后的文本内容

### parseDataToJson(inputPath, outputPath?)

便捷函数，等同于 DataParser.convertToJson

### parseJsonToData(jsonData, outputPath?)

便捷函数，等同于 DataParser.convertToText

## 错误处理

工具包含完善的错误处理机制：

```typescript
try {
  const result = await parseDataToJson('data/data.txt');
  console.log('转换成功', result);
} catch (error) {
  console.error('转换失败', error.message);
  // 处理错误...
}
```

## 数据结构说明

### 用户信息 (user)
- `username`: 用户名
- `password`: 密码

### 网络配置 (network)
- `mac`: MAC 地址
- `ip`: IP 地址
- `mask`: 子网掩码
- `gateway`: 网关地址

### 设备配置 (devices)
- `name`: 设备名称
- `type`: 设备类型
- `DINum`: 数字输入数量
- `DONum`: 数字输出数量

### 数字输入 (digitalInputs)
- `channel`: 通道名称 (DI0, DI1, ...)
- `device`: 所属设备
- `status`: 状态值

### 数字输出 (digitalOutputs)
- `channel`: 通道名称 (DO0, DO1, ...)
- `device`: 所属设备
- `action`: 动作值

### 模拟输入 (analogInputs)
- `channel`: 通道名称 (AI1, AI2, ...)
- `device`: 所属设备
- `status`: 状态值

## 注意事项

1. 确保输入文件格式正确
2. 文件路径使用绝对路径
3. 对于格式错误的行，工具会输出警告但不会中断处理
4. 数值会自动转换为数字类型，字符串保持为字符串类型
5. 输出目录不存在时会自动创建

## 测试

运行测试脚本：

```bash
# 使用 JavaScript 测试脚本
node src/utils/testParser.js

# 或者编译后运行 TypeScript
npm run build:ts
node dist/utils/dataParserExample.js
```
