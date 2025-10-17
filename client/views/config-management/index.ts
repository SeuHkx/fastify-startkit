export function register(Alpine: any, _root: Document){
    Alpine.data('configManagement', () => ({
      // 配置文件列表（动态加载）
      configList: [],

      // 初始化
      async init() {
        await this.loadConfigList();
      },

      // 加载配置列表
      async loadConfigList() {
        try {
          const res = await fetch('/data/config-list');
          const json = await res.json();
          if (json && json.success) {
            this.configList = json.data || [];
          }
        } catch (e) {
          console.error('加载配置列表失败:', e);
        }
      },
      
      // 下载配置文件
      async downloadConfig(config: any) {
        try {
          // 如果是 data.txt，则先请求后端生成
          if (config.fileName && config.fileName.toLowerCase() === 'data.txt') {
            const resp = await fetch('/data/export-txt', { method: 'POST' });
            const j = await resp.json();
            if (!j.success) {
              throw new Error(j.message || '生成 data.txt 失败');
            }
            // 重新加载列表以刷新尺寸/时间
            await this.loadConfigList();
          }

          // 创建下载链接（通过 /public 前缀的静态路径）
          const link = document.createElement('a');
          link.href = config.filePath.startsWith('/public') ? config.filePath : `/public${config.filePath}`;
          link.download = config.fileName;
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          this.showToast(`${config.name} 下载成功`, 'success');
        } catch (error: any) {
          console.error('下载失败:', error);
          this.showToast(`${config.name} 下载失败: ${error?.message || ''}`, 'error');
        }
      },
      
      // 显示提示信息
      showToast(message: string, type: string = 'info') {
        // 使用 Toastify 显示提示
        if (typeof (window as any).Toastify !== 'undefined') {
          (window as any).Toastify({
            text: message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: {
              background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'
            }
          }).showToast();
        }
      },
      
      // 获取文件大小显示
      getFileIcon(fileName: string) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
          case 'json':
            return '📄';
          case 'txt':
            return '📝';
          default:
            return '📁';
        }
      }
    }));
}