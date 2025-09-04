// auto scaffolded page script (TS) for input-config

interface DigitalInput {
  channel: string;
  device: string;
  status: number;
  selected?: boolean;
}

interface Device {
  name: string;
  type: string;
  DINum: number;
  DONum: number;
}

interface PaginationItem {
  type: 'page' | 'ellipsis';
  value?: number;
}

export function register(Alpine: any, _root: Document){
  Alpine.data('inputConfig', () => ({
    // 数据
    digitalInputs: [] as DigitalInput[],
    availableDevices: [] as Device[],
    
    // 状态
    isLoading: false,
    isSaving: false,
    
    // 分页相关
    currentPage: 1,
    pageSize: 20,
    goToPageInput: 1,
    
    // 编辑状态
    isEditing: false,
    editingIndex: -1,
    editForm: {
      channel: '',
      device: '',
      status: 0
    },
    
    // 添加状态
    isAdding: false,
    addForm: {
      channel: '',
      device: '',
      status: 0
    },
    
    // 验证错误
    errors: {
      channel: '',
      device: '',
      status: '',
      general: ''
    },

    // 计算属性
    get totalItems() {
      return this.digitalInputs.length;
    },

    get totalPages() {
      return Math.ceil(this.totalItems / this.pageSize);
    },

    get paginatedDigitalInputs() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.digitalInputs.slice(start, end);
    },

    get paginationItems(): PaginationItem[] {
      const items: PaginationItem[] = [];
      const totalPages = this.totalPages;
      const current = this.currentPage;
      
      if (totalPages <= 1) return items;
      
      // 简单的分页逻辑：显示当前页前后2页
      const start = Math.max(1, current - 2);
      const end = Math.min(totalPages, current + 2);
      
      if (start > 1) {
        items.push({ type: 'page', value: 1 });
        if (start > 2) {
          items.push({ type: 'ellipsis' });
        }
      }
      
      for (let i = start; i <= end; i++) {
        items.push({ type: 'page', value: i });
      }
      
      if (end < totalPages) {
        if (end < totalPages - 1) {
          items.push({ type: 'ellipsis' });
        }
        items.push({ type: 'page', value: totalPages });
      }
      
      return items;
    },

    get isFormValid() {
      const form = this.isAdding ? this.addForm : this.editForm;
      return form.channel && 
             form.device && 
             typeof form.status === 'number' &&
             !this.hasErrors;
    },

    get hasErrors() {
      return Object.values(this.errors).some(error => error !== '');
    },

    // 方法
    async init() {
      await this.loadData();
    },

    // 清空错误信息
    clearErrors() {
      this.errors = {
        channel: '',
        device: '',
        status: '',
        general: ''
      };
    },

    // 验证表单字段
    validateField(field: string, form: any) {
      switch (field) {
        case 'channel':
          if (!form.channel || form.channel.trim() === '') {
            this.errors.channel = '通道名称不能为空';
          } else if (!/^DI\d+$/.test(form.channel)) {
            this.errors.channel = '通道名称必须是 DI 加数字的格式 (如: DI0, DI1)';
          } else if (this.digitalInputs.some((di, index) => 
            di.channel === form.channel && (this.isAdding || index !== this.editingIndex)
          )) {
            this.errors.channel = '通道名称已存在';
          } else {
            this.errors.channel = '';
          }
          break;
        case 'device':
          if (!form.device || form.device.trim() === '') {
            this.errors.device = '请输入或选择设备';
          } else {
            this.errors.device = '';
          }
          break;
        case 'status':
          if (typeof form.status !== 'number') {
            this.errors.status = '状态值必须是数字';
          } else {
            this.errors.status = '';
          }
          break;
      }
    },

    // 加载数据
    async loadData() {
      this.isLoading = true;
      try {
        await Promise.all([
          this.loadDigitalInputs(),
          this.loadAvailableDevices()
        ]);
      } catch (error: any) {
        console.error('加载数据失败:', error);
        (window as any).Toastify({
          text: "加载数据失败",
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

    // 加载数字输入列表
    async loadDigitalInputs() {
      try {
        const response = await (window as any).axios({
          method: 'GET',
          url: '/digital-inputs',
          withCredentials: true
        });

        if (response.data.success) {
          this.digitalInputs = (response.data.data || []).map((di: DigitalInput) => ({
            ...di,
            selected: false
          }));
        } else {
          (window as any).Toastify({
            text: response.data.message || "加载数字输入列表失败",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            style: {
              background: "linear-gradient(to right, #ff416c, #ff4b2b)",
            }
          }).showToast();
        }
      } catch (error: any) {
        console.error('加载数字输入列表失败:', error);
        throw error;
      }
    },

    // 加载可用设备列表
    async loadAvailableDevices() {
      try {
        const response = await (window as any).axios({
          method: 'GET',
          url: '/digital-inputs/available-devices',
          withCredentials: true
        });

        if (response.data.success) {
          this.availableDevices = response.data.data || [];
        } else {
          console.warn('加载可用设备列表失败:', response.data.message);
        }
      } catch (error: any) {
        console.error('加载可用设备列表失败:', error);
        throw error;
      }
    },

    // 保存数字输入配置
    async saveDigitalInputs() {
      this.isSaving = true;
      try {
        const digitalInputsData = this.digitalInputs.map(di => ({
          channel: di.channel,
          device: di.device,
          status: di.status
        }));

        const response = await (window as any).axios({
          method: 'PUT',
          url: '/digital-inputs',
          data: { digitalInputs: digitalInputsData },
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.data.success) {
          (window as any).Toastify({
            text: "数字输入配置保存成功！",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            style: {
              background: "linear-gradient(to right, #00b09b, #96c93d)",
            }
          }).showToast();
          await this.loadDigitalInputs();
        } else {
          (window as any).Toastify({
            text: response.data.message || "保存失败",
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
        console.error('保存数字输入配置失败:', error);
        let errorMessage = '网络错误，请检查网络连接后重试';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
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
    },

    // 添加数字输入
    addDevice() {
      this.isAdding = true;
      // 生成下一个可用的通道名称
      const existingChannels = this.digitalInputs.map(di => di.channel);
      let nextChannelNum = 0;
      while (existingChannels.includes(`DI${nextChannelNum}`)) {
        nextChannelNum++;
      }
      
      this.addForm = {
        channel: `DI${nextChannelNum}`,
        device: '', // 默认为空，让用户手动输入或选择
        status: 0
      };
      this.clearErrors();
    },

    // 取消添加
    cancelAdd() {
      this.isAdding = false;
      this.clearErrors();
    },

    // 确认添加
    async confirmAdd() {
      this.clearErrors();
      
      // 验证表单
      this.validateField('channel', this.addForm);
      this.validateField('device', this.addForm);
      this.validateField('status', this.addForm);
      
      if (this.hasErrors) {
        (window as any).Toastify({
          text: "请检查输入信息",
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

      try {
        const response = await (window as any).axios({
          method: 'POST',
          url: '/digital-inputs',
          data: this.addForm,
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.data.success) {
          (window as any).Toastify({
            text: "数字输入添加成功！",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            style: {
              background: "linear-gradient(to right, #00b09b, #96c93d)",
            }
          }).showToast();
          this.isAdding = false;
          await this.loadDigitalInputs();
        } else {
          (window as any).Toastify({
            text: response.data.message || "添加失败",
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
        console.error('添加数字输入失败:', error);
        let errorMessage = '网络错误，请检查网络连接后重试';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
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
      }
    },

    // 编辑数字输入
    editDevice(index: number) {
      const actualIndex = (this.currentPage - 1) * this.pageSize + index;
      const di = this.digitalInputs[actualIndex];
      
      this.isEditing = true;
      this.editingIndex = actualIndex;
      this.editForm = {
        channel: di.channel,
        device: di.device,
        status: di.status
      };
      this.clearErrors();
    },

    // 取消编辑
    cancelEdit() {
      this.isEditing = false;
      this.editingIndex = -1;
      this.clearErrors();
    },

    // 确认编辑
    async confirmEdit() {
      this.clearErrors();
      
      // 验证表单
      this.validateField('channel', this.editForm);
      this.validateField('device', this.editForm);
      this.validateField('status', this.editForm);
      
      if (this.hasErrors) {
        (window as any).Toastify({
          text: "请检查输入信息",
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

      // 更新本地数据
      this.digitalInputs[this.editingIndex] = {
        ...this.digitalInputs[this.editingIndex],
        channel: this.editForm.channel,
        device: this.editForm.device,
        status: this.editForm.status
      };

      // 保存到服务器
      await this.saveDigitalInputs();
      this.isEditing = false;
      this.editingIndex = -1;
    },

    // 删除单个数字输入
    async deleteDevice(index: number) {
      const actualIndex = (this.currentPage - 1) * this.pageSize + index;
      const di = this.digitalInputs[actualIndex];
      
      if (!(window as any).confirm(`确定要删除数字输入 ${di.channel} 吗？`)) {
        return;
      }

      try {
        const response = await (window as any).axios({
          method: 'DELETE',
          url: '/digital-inputs',
          data: { channels: [di.channel] },
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.data.success) {
          (window as any).Toastify({
            text: "数字输入删除成功！",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            style: {
              background: "linear-gradient(to right, #00b09b, #96c93d)",
            }
          }).showToast();
          await this.loadDigitalInputs();
          
          // 如果当前页没有数据了，返回上一页
          if (this.paginatedDigitalInputs.length === 0 && this.currentPage > 1) {
            this.currentPage--;
            this.goToPageInput = this.currentPage;
          }
        } else {
          (window as any).Toastify({
            text: response.data.message || "删除失败",
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
        console.error('删除数字输入失败:', error);
        let errorMessage = '网络错误，请检查网络连接后重试';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
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
      }
    },

    // 删除选中的数字输入
    async deleteSelected() {
      const selectedDigitalInputs = this.paginatedDigitalInputs.filter(di => di.selected);
      if (selectedDigitalInputs.length === 0) {
        (window as any).Toastify({
          text: '请先选择要删除的数字输入',
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
      
      if (!(window as any).confirm(`确定要删除选中的 ${selectedDigitalInputs.length} 个数字输入吗？`)) {
        return;
      }

      try {
        const channels = selectedDigitalInputs.map(di => di.channel);
        const response = await (window as any).axios({
          method: 'DELETE',
          url: '/digital-inputs',
          data: { channels },
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.data.success) {
          (window as any).Toastify({
            text: `成功删除 ${selectedDigitalInputs.length} 个数字输入！`,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            style: {
              background: "linear-gradient(to right, #00b09b, #96c93d)",
            }
          }).showToast();
          await this.loadDigitalInputs();
          
          // 如果当前页没有数据了，返回上一页
          if (this.paginatedDigitalInputs.length === 0 && this.currentPage > 1) {
            this.currentPage--;
            this.goToPageInput = this.currentPage;
          }
        } else {
          (window as any).Toastify({
            text: response.data.message || "删除失败",
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
        console.error('删除数字输入失败:', error);
        let errorMessage = '网络错误，请检查网络连接后重试';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
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
      }
    },

    toggleSelectAll(event: Event) {
      const target = event.target as HTMLInputElement;
      const isChecked = target.checked;
      this.paginatedDigitalInputs.forEach(di => {
        di.selected = isChecked;
      });
    },

    // 分页方法
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.goToPageInput = this.currentPage;
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.goToPageInput = this.currentPage;
      }
    },

    goToPage(page: number) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.goToPageInput = page;
      }
    },

    // 保存配置
    async saveChanges() {
      await this.saveDigitalInputs();
    }
  }));
}
