// auto scaffolded page script (TS) for device-management

// 全局声明
declare const page: any;

export function register(Alpine: any, _root: Document){
    Alpine.data('deviceManagement', () => ({
      // 设备数据
      allDevices: [],
      
      // 分页相关属性
      currentPage: 1,
      pageSize: 20,
      goToPageInput: 1,
      
      // 状态
      isLoading: false,
      isSaving: false,
      

      
      // 添加状态
      isAdding: false,
      addForm: {
        id: '',
        name: '',
        type: '',
        status: '在线',
        inputPoints: 0,
        outputPoints: 0
      },
      
      // 验证错误
      errors: {
        id: '',
        name: '',
        type: '',
        status: '',
        inputPoints: '',
        outputPoints: '',
        general: ''
      },
      
      // 计算属性 - 使用 getter 方式（Alpine.js 支持）
      get isFormValid() {
        const form = this.addForm;
        return form.id && 
               form.name && 
               form.type && 
               form.status &&
               typeof form.inputPoints === 'number' && 
               typeof form.outputPoints === 'number' &&
               form.inputPoints >= 0 && 
               form.outputPoints >= 0 &&
               !this.hasErrors;
      },

      get hasErrors() {
        return Object.values(this.errors).some(error => error !== '');
      },

      // 分页计算属性
      get totalItems() {
        return this.allDevices.length;
      },

      get totalPages() {
        return Math.ceil(this.totalItems / this.pageSize);
      },

      get devices() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.allDevices.slice(start, end);
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
          items.push({ type: 'ellipsis', value: '...' });
        }
        
        // 添加中间页码
        for (let i = startPage; i <= endPage; i++) {
          items.push({ type: 'page', value: i });
        }
        
        // 添加省略号
        if (endPage < totalPages - 1) {
          items.push({ type: 'ellipsis', value: '...' });
        }
        
        // 始终显示最后一页
        if (totalPages > 1) {
          items.push({ type: 'page', value: totalPages });
        }
        
        return items;
      },
      
      // 初始化
      init() {
        this.loadDevices();
      },
      
      // 加载设备数据
      async loadDevices() {
        this.isLoading = true;
        try {
          const response = await fetch('/device-management');
          const result = await response.json();
          
          if (result.success) {
            // 转换API数据格式为前端需要的格式
            this.allDevices = result.data.map((device: any) => ({
              id: device.id,
              deviceID:device.deviceID,
              name: device.name,
              type: device.deviceTypeName || device.deviceTypeCode || '未知类型',
              status: device.deviceTypeStatus === true ? '启用' : '禁用',
              inputPoints: device.DINum || 0,
              outputPoints: device.DONum || 0,
              conaddr: device.conaddr,
              retadd: device.retadd,
              deviceTypeStatus: device.deviceTypeStatus,
              selected: false
            }));
          } else {
            throw new Error(result.message || '获取设备数据失败');
          }
          
        } catch (error) {
          console.error('加载设备数据失败:', error);
          this.errors.general = '加载设备数据失败，请重试';
        } finally {
          this.isLoading = false;
        }
      },
      
      // 验证字段
      validateField(fieldName: string, form: any) {
        this.errors[fieldName] = '';
        
        switch (fieldName) {
          case 'id':
            if (!form.id || form.id.trim() === '') {
              this.errors[fieldName] = '设备ID不能为空';
            } else if (form.id.length > 20) {
              this.errors[fieldName] = '设备ID长度不能超过20个字符';
            }
            break;
          case 'name':
            if (!form.name || form.name.trim() === '') {
              this.errors[fieldName] = '设备名称不能为空';
            } else if (form.name.length > 50) {
              this.errors[fieldName] = '设备名称长度不能超过50个字符';
            }
            break;
          case 'type':
            if (!form.type || form.type.trim() === '') {
              this.errors[fieldName] = '设备类型不能为空';
            }
            break;
          case 'inputPoints':
            if (typeof form.inputPoints !== 'number' || form.inputPoints < 0) {
              this.errors[fieldName] = '输入点数必须是非负整数';
            }
            break;
          case 'outputPoints':
            if (typeof form.outputPoints !== 'number' || form.outputPoints < 0) {
              this.errors[fieldName] = '输出点数必须是非负整数';
            }
            break;
        }
      },
      
      // 添加设备 - 跳转到添加页面
      addDevice() {
        console.log('[DeviceManagement] 跳转到添加设备页面');
        
        // 使用路由跳转到添加设备页面
        if (typeof page !== 'undefined') {
          page('/device-management/add');
        }
      },
      
      // 确认添加
      async confirmAdd() {
        // 验证表单
        Object.keys(this.addForm).forEach(key => {
          this.validateField(key, this.addForm);
        });
        
        if (!this.isFormValid) {
          return;
        }
        
        this.isSaving = true;
        try {
          const response = await fetch('/devices', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: this.addForm.name,
              code: this.addForm.type, // 使用type作为code
              status: this.addForm.status === '在线',
              points: [] // 暂时为空，后续可以扩展
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            // 重新加载设备列表
            await this.loadDevices();
            
            this.isAdding = false;
            this.clearErrors();
            
            // 跳转到最后一页显示新添加的设备
            this.currentPage = Math.ceil(this.allDevices.length / this.pageSize);
          } else {
            throw new Error(result.message || '添加设备失败');
          }
          
        } catch (error) {
          console.error('添加设备失败:', error);
          this.errors.general = error.message || '添加设备失败，请重试';
        } finally {
          this.isSaving = false;
        }
      },
      
      // 取消添加
      cancelAdd() {
        this.isAdding = false;
        this.clearErrors();
      },
      
      // 编辑设备
      editDevice(deviceId: string) {
        console.log('[DeviceManagement] 编辑设备ID:', deviceId);
        
        if (typeof page !== 'undefined') {
          const editUrl = `/device-management/edit/${encodeURIComponent(deviceId)}`;
          console.log('[DeviceManagement] 跳转到:', editUrl);
          
          try {
            page(editUrl);
          } catch (error) {
            console.error('[DeviceManagement] 路由跳转失败:', error);
            // 备用方案：使用hashbang格式
            window.location.hash = `#!/device-management/edit/${encodeURIComponent(deviceId)}`;
          }
        } else {
          console.error('[DeviceManagement] 路由对象未定义');
          // 直接使用hashbang格式
          window.location.hash = `#!/device-management/edit/${encodeURIComponent(deviceId)}`;
        }
      },
      

      
      // 删除单个设备
      async deleteDevice(deviceId: string) {
        const device = this.allDevices.find(d => d.id === deviceId);
        
        if (!device) {
          console.error('设备不存在:', deviceId);
          return;
        }
        
        if (!confirm(`确定要删除设备 "${device.name}" 吗？`)) {
          return;
        }
        
        try {
          // 使用id作为删除的标识符
          const actualDeviceId = device.id;
          const response = await fetch(`/device-instances/${actualDeviceId}/delete`, {
            method: 'POST'
          });
          
          const result = await response.json();
          
          if (result.success) {
            // 重新加载设备列表
            await this.loadDevices();
            
            // 如果当前页没有数据了，回到上一页
            if (this.devices.length === 0 && this.currentPage > 1) {
              this.currentPage--;
            }
          } else {
            throw new Error(result.message || '删除设备失败');
          }
          
        } catch (error) {
          console.error('删除设备失败:', error);
          this.errors.general = error.message || '删除设备失败，请重试';
        }
      },
      
      // 批量删除选中的设备
      async deleteSelected() {
        const selectedDevices = this.allDevices.filter(device => device.selected);
        
        if (selectedDevices.length === 0) {
          alert('请先选择要删除的设备');
          return;
        }
        
        if (!confirm(`确定要删除选中的 ${selectedDevices.length} 个设备吗？`)) {
          return;
        }
        
        try {
          const response = await fetch('/device-instances/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceIds: selectedDevices.map(d => d.id)
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            // 重新加载设备列表
            await this.loadDevices();
            
            // 如果当前页没有数据了，回到第一页
            if (this.devices.length === 0 && this.currentPage > 1) {
              this.currentPage = 1;
            }
          } else {
            throw new Error(result.message || '批量删除设备失败');
          }
          
        } catch (error) {
          console.error('批量删除设备失败:', error);
          this.errors.general = error.message || '批量删除设备失败，请重试';
        }
      },
      
      // 全选/取消全选
      toggleSelectAll() {
        const allSelected = this.devices.every(device => device.selected);
        this.devices.forEach(device => {
          device.selected = !allSelected;
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
        const pageNum = parseInt(page?.toString()) || 1;
        if (pageNum >= 1 && pageNum <= this.totalPages) {
          this.currentPage = pageNum;
          this.goToPageInput = pageNum;
        }
      },
      


      // 清除错误信息
      clearErrors() {
        Object.keys(this.errors).forEach(key => {
          this.errors[key] = '';
        });
      },
      
      // 监听页面大小变化
      $watch: {
        pageSize() {
          this.currentPage = 1;
          this.goToPageInput = 1;
        }
      }
    }));
}