// ESM page script for qr-code
export function register(Alpine: any, _root: Document){
  Alpine.data('qrCode', () => ({
    form:{
        scene:'001',
        page: '', // 可选，小程序页面路径
        width: 430, // 二维码宽度，默认 430
    },
    // 批量生成相关
    batchMode: false, // 是否为批量模式
    batchText: '', // 批量场景值文本（每行一个）- 自由输入模式
    batchLoading: false,
    
    // 区域序列生成模式
    useRegionMode: false, // 是否使用区域序列模式
    regionCode: '510102', // 选中的区域代码
    batchCount: 100, // 生成数量
    startNumber: 1, // 起始序号
    
    // 区域列表（可以从后端获取或配置）
    regions: [
      { code: '510102', name: '成都高新区' },
      { code: '510104', name: '成都锦江区' },
      { code: '510105', name: '成都青羊区' },
      { code: '510106', name: '成都金牛区' },
      { code: '510107', name: '成都武侯区' },
      { code: '510108', name: '成都成华区' },
      { code: '510112', name: '成都龙泉驿区' },
      { code: '510113', name: '成都青白江区' },
      { code: '510114', name: '成都新都区' },
      { code: '510115', name: '成都温江区' },
      { code: '510116', name: '成都双流区' },
      { code: '510117', name: '成都郫都区' },
    ],
    
    qrCodeUrl: '', // 生成的二维码图片 URL
    loading: false,
    error: '',
    async init() {
      // 初始化时清空所有错误并加载当前设置
      console.log("QR Code page initialized", this.form);
    },
    
    /**
     * 切换单个/批量模式
     */
    toggleBatchMode() {
      this.batchMode = !this.batchMode;
      this.error = '';
      this.qrCodeUrl = '';
    },
    
    /**
     * 切换批量生成的子模式（区域序列 vs 自由输入）
     */
    toggleRegionMode() {
      this.useRegionMode = !this.useRegionMode;
      this.error = '';
    },
    
    /**
     * 生成区域序列场景值列表
     */
    generateRegionScenes() {
      const scenes = [];
      const digitCount = 7; // 序号位数，例如 0000001
      
      for (let i = 0; i < this.batchCount; i++) {
        const number = this.startNumber + i;
        const paddedNumber = String(number).padStart(digitCount, '0');
        const scene = `${this.regionCode}${paddedNumber}`;
        scenes.push(scene);
      }
      
      return scenes;
    },
    
    /**
     * 生成单个二维码
     */
    async generateQRCode() {
      try {
        this.loading = true;
        this.error = '';
        this.qrCodeUrl = '';
        
        // 验证必填参数
        if (!this.form.scene) {
          this.error = 'scene 参数不能为空';
          return;
        }
        
        // 调用后端接口生成二维码 (现在返回 JSON)
        const response = await fetch('/qrcode/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            externalId: `web_${Date.now()}`, // 生成一个临时的外部ID
            scene: this.form.scene,
            page: this.form.page || undefined,
            width: this.form.width || 430,
          }),
        });
        
        // 解析 JSON 响应
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || '生成二维码失败');
        }
        
        // 将 base64 转换为 Blob URL 并显示
        const base64Data = result.data.qrcodeBase64;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        this.qrCodeUrl = URL.createObjectURL(blob);
        
        console.log('二维码生成成功, 记录ID:', result.data.id, '外部ID:', result.data.externalId);
      } catch (error: any) {
        console.error('生成二维码失败:', error);
        this.error = error.message || '生成二维码时发生未知错误';
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 批量生成二维码并下载
     */
    async batchGenerateQRCode() {
      try {
        this.batchLoading = true;
        this.error = '';
        
        let items = [];
        
        // 根据模式生成不同的场景值列表
        if (this.useRegionMode) {
          // 区域序列模式
          if (!this.regionCode) {
            this.error = '请选择区域';
            return;
          }
          
          if (!this.batchCount || this.batchCount <= 0) {
            this.error = '请输入有效的生成数量';
            return;
          }
          
          if (this.batchCount > 500) {
            this.error = '单次生成数量不能超过 500';
            return;
          }
          
          // 生成区域序列
          const scenes = this.generateRegionScenes();
          items = scenes.map(scene => ({ scene }));
          
          console.log(`生成区域序列：${this.regionCode}，数量：${this.batchCount}，从 ${scenes[0]} 到 ${scenes[scenes.length - 1]}`);
          
        } else {
          // 自由输入模式
          if (!this.batchText.trim()) {
            this.error = '请输入批量场景值，每行一个';
            return;
          }
          
          // 解析批量文本，每行一个场景值
          const lines = this.batchText.trim().split('\n').filter(line => line.trim());
          if (lines.length === 0) {
            this.error = '请输入至少一个场景值';
            return;
          }
          
          // 构建批量生成列表
          items = lines.map(line => {
            const trimmed = line.trim();
            // 支持格式: "scene" 或 "scene|filename"
            const parts = trimmed.split('|');
            return {
              scene: parts[0].trim(),
              filename: parts[1] ? parts[1].trim() : undefined,
            };
          });
        }
        
        // 调用后端批量生成接口
        const response = await fetch('/qrcode/batch-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: items,
            page: this.form.page || undefined,
            width: this.form.width || 430,
          }),
        });
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || '批量生成失败');
          } else {
            throw new Error(`批量生成失败: ${response.statusText}`);
          }
        }
        
        // 下载 ZIP 文件
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // 根据模式设置不同的文件名
        const filename = this.useRegionMode 
          ? `qrcodes-${this.regionCode}-${Date.now()}.zip`
          : `qrcodes-batch-${Date.now()}.zip`;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        
        console.log(`批量生成成功，共 ${items.length} 个二维码`);
        
      } catch (error: any) {
        console.error('批量生成二维码失败:', error);
        this.error = error.message || '批量生成二维码时发生未知错误';
      } finally {
        this.batchLoading = false;
      }
    },
    
    /**
     * 下载单个二维码
     */
    downloadQRCode() {
      if (!this.qrCodeUrl) {
        this.error = '请先生成二维码';
        return;
      }
      
      const link = document.createElement('a');
      link.href = this.qrCodeUrl;
      link.download = `qrcode-${this.form.scene}.png`;
      link.click();
    },
    
    /**
     * 清空错误信息
     */
    clearError() {
      this.error = '';
    }
  }));
}
