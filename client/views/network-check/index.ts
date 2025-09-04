// ESM page script for network-check
export function register(Alpine: any, _root: Document){
  Alpine.data('networkCheck', () => ({
    form: {
      macAddress: '',
      ipAddress: '',
      subnetMask: '',
      gateway: ''
    },
    
    // 状态
    isLoading: false,
    isSaving: false,
    
    // 验证错误信息
    errors: {
      macAddress: '',
      ipAddress: '',
      subnetMask: '',
      gateway: '',
      general: ''
    },

    // 计算属性 - 表单验证
    get isFormValid() {
      return this.form.macAddress && 
             this.form.ipAddress && 
             this.form.subnetMask && 
             this.form.gateway &&
             !this.hasErrors;
    },

    get hasErrors() {
      return Object.values(this.errors).some(error => error !== '');
    },

    // 方法
    async init() {
      // 初始化时清空所有错误并加载当前设置
      this.clearErrors();
      await this.loadNetworkSettings();
    },

    // 清空错误信息
    clearErrors() {
      this.errors = {
        macAddress: '',
        ipAddress: '',
        subnetMask: '',
        gateway: '',
        general: ''
      };
    },

    // 验证IP地址格式
    validateIP(ip: string): boolean {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      return ipRegex.test(ip);
    },

    // 验证MAC地址格式
    validateMAC(mac: string): boolean {
      const macRegex = /^([0-9A-Fa-f]{2}[.-:]){5}([0-9A-Fa-f]{2})$/;
      return macRegex.test(mac);
    },

    // 验证表单字段
    validateField(field: string) {
      switch (field) {
        case 'macAddress':
          if (!this.form.macAddress) {
            this.errors.macAddress = '请输入MAC地址';
          } else if (!this.validateMAC(this.form.macAddress)) {
            this.errors.macAddress = 'MAC地址格式不正确，应为 XX.XX.XX.XX.XX.XX 格式';
          } else {
            this.errors.macAddress = '';
          }
          break;
        case 'ipAddress':
          if (!this.form.ipAddress) {
            this.errors.ipAddress = '请输入IP地址';
          } else if (!this.validateIP(this.form.ipAddress)) {
            this.errors.ipAddress = 'IP地址格式不正确';
          } else {
            this.errors.ipAddress = '';
          }
          break;
        case 'subnetMask':
          if (!this.form.subnetMask) {
            this.errors.subnetMask = '请输入子网掩码';
          } else if (!this.validateIP(this.form.subnetMask)) {
            this.errors.subnetMask = '子网掩码格式不正确';
          } else {
            this.errors.subnetMask = '';
          }
          break;
        case 'gateway':
          if (!this.form.gateway) {
            this.errors.gateway = '请输入默认网关';
          } else if (!this.validateIP(this.form.gateway)) {
            this.errors.gateway = '网关地址格式不正确';
          } else {
            this.errors.gateway = '';
          }
          break;
      }
    },

    // 加载当前网络设置
    async loadNetworkSettings() {
      this.isLoading = true;
      try {
        const response = await (window as any).axios({
          method: 'GET',
          url: '/network-settings',
          withCredentials: true
        });

        if (response.data.success && response.data.data) {
          const data = response.data.data;
          this.form.macAddress = data.mac || '';
          this.form.ipAddress = data.ip || '';
          this.form.subnetMask = data.mask || '';
          this.form.gateway = data.gateway || '';
        }
      } catch (error: any) {
        console.error('加载网络设置失败:', error);
        (window as any).Toastify({
          text: "加载网络设置失败",
          duration: 3000,
          close: true,
          gravity: "top",
          position: "center",
          style: {
            background: "linear-gradient(to right, #ff416c, #ff4b2b)",
          }
        }).showToast();
      } finally {
        this.isLoading = false;
      }
    },

    // 保存网络设置
    async saveNetworkSettings() {
      // 清空之前的错误
      this.clearErrors();
      
      // 验证所有字段
      this.validateField('macAddress');
      this.validateField('ipAddress');
      this.validateField('subnetMask');
      this.validateField('gateway');
      
      // 如果有验证错误，停止提交
      if (this.hasErrors) {
        (window as any).Toastify({
          text: "请检查输入的信息格式",
          duration: 3000,
          close: true,
          gravity: "top",
          position: "center",
          style: {
            background: "linear-gradient(to right, #ff5f6d, #ffc371)",
          }
        }).showToast();
        return;
      }
      
      this.isSaving = true;
      
      try {
        const response = await (window as any).axios({
          method: 'POST',
          url: '/network-settings',
          data: {
            macAddress: this.form.macAddress,
            ipAddress: this.form.ipAddress,
            subnetMask: this.form.subnetMask,
            gateway: this.form.gateway
          },
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.data.success) {
          (window as any).Toastify({
            text: "网络设置保存成功！",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            style: {
              background: "linear-gradient(to right, #00b09b, #96c93d)",
            }
          }).showToast();
        } else {
          this.errors.general = response.data.message || '保存失败，请重试';
          (window as any).Toastify({
            text: this.errors.general,
            duration: 4000,
            close: true,
            gravity: "top",
            position: "center",
            style: {
              background: "linear-gradient(to right, #ff5f6d, #ffc371)",
            }
          }).showToast();
        }
      } catch (error: any) {
        console.error('保存网络设置失败:', error);
        
        let errorMessage = '网络错误，请检查网络连接后重试';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        this.errors.general = errorMessage;
        (window as any).Toastify({
          text: errorMessage,
          duration: 4000,
          close: true,
          gravity: "top",
          position: "center",
          style: {
            background: "linear-gradient(to right, #ff416c, #ff4b2b)",
          }
        }).showToast();
      } finally {
        this.isSaving = false;
      }
    }
  }));
}
