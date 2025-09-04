// ESM page script for change-password
export function register(Alpine: any, _root: Document){
  Alpine.data('changePassword', () => ({
    // 表单数据
    newPassword: '',
    confirmPassword: '',
    
    // 状态
    isLoading: false,
    showNewPassword: false,
    showConfirmPassword: false,
    
    // 验证错误信息
    errors: {
      newPassword: '',
      confirmPassword: '',
      general: ''
    },

    // 计算属性 - 表单验证
    get isFormValid() {
      return this.newPassword.length >= 6 && 
             this.confirmPassword === this.newPassword &&
             !this.hasErrors;
    },

    get hasErrors() {
      return Object.values(this.errors).some(error => error !== '');
    },

    // 方法
    init() {
      // 初始化时清空所有错误
      this.clearErrors();
    },

    // 清空错误信息
    clearErrors() {
      this.errors = {
        newPassword: '',
        confirmPassword: '',
        general: ''
      };
    },

    // 验证新密码
    validateNewPassword() {
      if (!this.newPassword) {
        this.errors.newPassword = '请输入新密码';
      } else if (this.newPassword.length < 6) {
        this.errors.newPassword = '新密码长度至少6位';
      } else if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(this.newPassword)) {
        this.errors.newPassword = '新密码必须包含字母和数字';
      } else {
        this.errors.newPassword = '';
      }
      
      // 如果新密码有变化，重新验证确认密码
      if (this.confirmPassword) {
        this.validateConfirmPassword();
      }
    },

    // 验证确认密码
    validateConfirmPassword() {
      if (!this.confirmPassword) {
        this.errors.confirmPassword = '请确认新密码';
      } else if (this.confirmPassword !== this.newPassword) {
        this.errors.confirmPassword = '两次输入的密码不一致';
      } else {
        this.errors.confirmPassword = '';
      }
    },

    // 切换密码显示状态
    togglePasswordVisibility(field: 'new' | 'confirm') {
      switch (field) {
        case 'new':
          this.showNewPassword = !this.showNewPassword;
          break;
        case 'confirm':
          this.showConfirmPassword = !this.showConfirmPassword;
          break;
      }
    },

    // 重置表单
    resetForm() {
      this.newPassword = '';
      this.confirmPassword = '';
      this.clearErrors();
      this.showNewPassword = false;
      this.showConfirmPassword = false;
    },

    // 提交表单
    async submitForm() {
      // 清空之前的错误
      this.clearErrors();
      
      // 验证所有字段
      this.validateNewPassword();
      this.validateConfirmPassword();
      
      // 如果有验证错误，停止提交
      if (this.hasErrors) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        // 调用真实的 API
        const response = await this.callChangePasswordAPI();
        
        if (response.success) {
          // 使用 Toastify 显示成功消息
          (window as any).Toastify({
            text: "密码修改成功！请重新登录。",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            style: {
              background: "linear-gradient(to right, #00b09b, #96c93d)",
            }
          }).showToast();
          
          // 延迟跳转，让用户看到成功消息
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        } else {
          this.errors.general = response.message || '密码修改失败，请重试';
          // 显示错误提示
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
      } catch (error) {
        console.error('修改密码失败:', error);
        this.errors.general = '网络错误，请检查网络连接后重试';
        // 显示网络错误提示
        (window as any).Toastify({
          text: this.errors.general,
          duration: 4000,
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

    // 调用修改密码 API
    async callChangePasswordAPI() {
      try {
        const response = await (window as any).axios({
          method: 'POST',
          url: '/change-password',
          data: {
            newPassword: this.newPassword
          },
          withCredentials: true, // 包含cookies
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        return response.data;
      } catch (error: any) {
        // axios 错误处理
        if (error.response) {
          // 服务器响应了错误状态码
          throw {
            success: false,
            message: error.response.data?.message || `服务器错误: ${error.response.status}`
          };
        } else if (error.request) {
          // 请求已发出但没有收到响应
          throw {
            success: false,
            message: '网络连接失败，请检查网络连接'
          };
        } else {
          // 请求配置出错
          throw {
            success: false,
            message: error.message || '请求配置错误'
          };
        }
      }
    }
  }));
}
