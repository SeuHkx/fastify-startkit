// auto scaffolded page script (TS) for device-type
export function register(Alpine: any, _root: Document){
    Alpine.data('deviceType', () => ({
      // 设备数据
      allDevices: [],
      
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
        name: '',
        type: '',
        DINum: 0,
        DONum: 0
      },
      
      // 添加状态
      isAdding: false,
      addForm: {
        name: '',
        type: '',
        DINum: 0,
        DONum: 0
      },
      
      // 验证错误
      errors: {
        name: '',
        type: '',
        DINum: '',
        DONum: '',
        general: ''
      },
      
      // 计算属性
      get devices() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.allDevices.slice(start, end);
      },
      
      get totalItems() {
        return this.allDevices.length;
      },
      
      get totalPages() {
        return Math.ceil(this.totalItems / this.pageSize);
      },
      
      get paginationItems() {
        const items: any[] = [];
        const currentPage = this.currentPage;
        const totalPages = this.totalPages;
        
        if (totalPages <= 1) return items;
        
        // 始终显示第一页
        items.push({ type: 'page', value: 1 });
        
        // 当前页前后的页码
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);
        
        // 如果当前页靠近开始，多显示后面的页码
        if (currentPage <= 3) {
          endPage = Math.min(totalPages - 1, 5);
        }
        
        // 如果当前页靠近结束，多显示前面的页码
        if (currentPage >= totalPages - 2) {
          startPage = Math.max(2, totalPages - 4);
        }
        
        // 添加省略号
        if (startPage > 2) {
          items.push({ type: 'ellipsis', value: null });
        }
        
        // 添加中间页码
        for (let i = startPage; i <= endPage; i++) {
          items.push({ type: 'page', value: i });
        }
        
        // 添加省略号
        if (endPage < totalPages - 1) {
          items.push({ type: 'ellipsis', value: null });
        }
        
        // 始终显示最后一页
        if (totalPages > 1) {
          items.push({ type: 'page', value: totalPages });
        }
        
        return items;
      },

      get isFormValid() {
        const form = this.isAdding ? this.addForm : this.editForm;
        return form.name && 
               form.type && 
               typeof form.DINum === 'number' && 
               typeof form.DONum === 'number' &&
               form.DINum >= 0 && 
               form.DONum >= 0 &&
               !this.hasErrors;
      },

      get hasErrors() {
        return Object.values(this.errors).some(error => error !== '');
      },
      
      // 方法
      async init() {
        await this.loadDevices();
      },

      // 清空错误信息
      clearErrors() {
        this.errors = {
          name: '',
          type: '',
          DINum: '',
          DONum: '',
          general: ''
        };
      },

      // 验证表单字段
      validateField(field: string, form: any) {
        switch (field) {
          case 'name':
            if (!form.name || form.name.trim() === '') {
              this.errors.name = '设备名称不能为空';
            } else if (this.allDevices.some((device:any, index) =>
              device.name === form.name && (this.isAdding || index !== this.editingIndex)
            )) {
              this.errors.name = '设备名称已存在';
            } else {
              this.errors.name = '';
            }
            break;
          case 'type':
            if (!form.type || form.type.trim() === '') {
              this.errors.type = '设备类型不能为空';
            } else {
              this.errors.type = '';
            }
            break;
          case 'DINum':
            if (typeof form.DINum !== 'number' || form.DINum < 0) {
              this.errors.DINum = '输入点数必须是非负整数';
            } else {
              this.errors.DINum = '';
            }
            break;
          case 'DONum':
            if (typeof form.DONum !== 'number' || form.DONum < 0) {
              this.errors.DONum = '输出点数必须是非负整数';
            } else {
              this.errors.DONum = '';
            }
            break;
        }
      },

      // 加载设备列表
      async loadDevices() {
        try {
          const response = await (window as any).axios({
            method: 'GET',
            url: '/devices',
            withCredentials: true
          });
          this.isLoading = true;

          if (response.data.success) {
            this.allDevices = response.data.data || [];
            // 为每个设备添加选择状态
            this.allDevices.forEach((device:any) => {
              device.selected = false;
            });
          } else {
            (window as any).Toastify({
              text: response.data.message || "加载设备列表失败",
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
          console.error('加载设备列表失败:', error);
          (window as any).Toastify({
            text: "加载设备列表失败",
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

      // 保存设备列表
      async saveDevices() {
        this.isSaving = true;
        try {
          const devicesData = this.allDevices.map((device:any) => ({
            name: device.name,
            type: device.type,
            DINum: device.DINum,
            DONum: device.DONum
          }));

          const response = await (window as any).axios({
            method: 'PUT',
            url: '/devices',
            data: { devices: devicesData },
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (response.data.success) {
            (window as any).Toastify({
              text: "设备配置保存成功！",
              duration: 3000,
              close: true,
              gravity: "top",
              position: "center",
              style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
              }
            }).showToast();
            await this.loadDevices();
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
          console.error('保存设备配置失败:', error);
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
      
      goToPage(page:any) {
        if (page >= 1 && page <= this.totalPages) {
          this.currentPage = page;
          this.goToPageInput = page;
        }
      },
      
      toggleSelectAll() {
        const allSelected = this.devices.every((device:any) => device.selected);
        this.devices.forEach((device:any) => {
          device.selected = !allSelected;
        });
      },
      
      // 添加设备
      addDevice() {
        this.isAdding = true;
        this.addForm = {
          name: '',
          type: '',
          DINum: 0,
          DONum: 0
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
        this.validateField('name', this.addForm);
        this.validateField('type', this.addForm);
        this.validateField('DINum', this.addForm);
        this.validateField('DONum', this.addForm);
        
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
            url: '/devices',
            data: this.addForm,
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (response.data.success) {
            (window as any).Toastify({
              text: "设备添加成功！",
              duration: 3000,
              close: true,
              gravity: "top",
              position: "center",
              style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
              }
            }).showToast();
            this.isAdding = false;
            await this.loadDevices();
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
          console.error('添加设备失败:', error);
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
      
      // 编辑设备
      editDevice(index:any) {
        const actualIndex = (this.currentPage - 1) * this.pageSize + index;
        const device:any = this.allDevices[actualIndex];
        
        this.isEditing = true;
        this.editingIndex = actualIndex;
        this.editForm = {
          name: device.name,
          type: device.type,
          DINum: device.DINum,
          DONum: device.DONum
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
        this.validateField('name', this.editForm);
        this.validateField('type', this.editForm);
        this.validateField('DINum', this.editForm);
        this.validateField('DONum', this.editForm);
        
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

        // 更新本地数据（校验索引并使用 splice 原子替换，避免对可能为 undefined 的对象做展开）
        const idx = this.editingIndex;
        if (idx < 0 || idx >= this.allDevices.length) {
          console.warn('无效的编辑索引：', idx);
          return;
        }
        const prev:any = this.allDevices[idx] || {} as any;
        // @ts-ignore
        this.allDevices.splice(idx, 1, {
          ...prev,
          name: this.editForm.name,
          type: this.editForm.type,
          DINum: this.editForm.DINum,
          DONum: this.editForm.DONum
        });

        // 保存到服务器
        await this.saveDevices();
        this.isEditing = false;
        this.editingIndex = -1;
      },
      
      // 删除单个设备
      async deleteDevice(index:any) {
        const actualIndex = (this.currentPage - 1) * this.pageSize + index;
        const device:any = this.allDevices[actualIndex];
        
        if (!(window as any).confirm(`确定要删除设备 ${device.name} 吗？`)) {
          return;
        }

        try {
          const response = await (window as any).axios({
            method: 'DELETE',
            url: '/devices',
            data: { deviceNames: [device.name] },
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (response.data.success) {
            (window as any).Toastify({
              text: "设备删除成功！",
              duration: 3000,
              close: true,
              gravity: "top",
              position: "center",
              style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
              }
            }).showToast();
            await this.loadDevices();
            
            // 如果当前页没有数据了，返回上一页
            if (this.devices.length === 0 && this.currentPage > 1) {
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
          console.error('删除设备失败:', error);
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
      
      // 删除选中的设备
      async deleteSelected() {
        const selectedDevices = this.devices.filter((device:any) => device.selected);
        if (selectedDevices.length === 0) {
          (window as any).Toastify({
            text: '请先选择要删除的设备',
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
        
        if (!(window as any).confirm(`确定要删除选中的 ${selectedDevices.length} 个设备吗？`)) {
          return;
        }

        try {
          const deviceNames = selectedDevices.map((device:any) => device.name);
          const response = await (window as any).axios({
            method: 'DELETE',
            url: '/devices',
            data: { deviceNames },
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (response.data.success) {
            (window as any).Toastify({
              text: `成功删除 ${selectedDevices.length} 个设备！`,
              duration: 3000,
              close: true,
              gravity: "top",
              position: "center",
              style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
              }
            }).showToast();
            await this.loadDevices();
            
            // 如果当前页没有数据了，返回上一页
            if (this.devices.length === 0 && this.currentPage > 1) {
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
          console.error('删除设备失败:', error);
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
      }
    }));
  };
