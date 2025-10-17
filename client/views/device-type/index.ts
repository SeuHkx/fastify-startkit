// auto scaffolded page script (TS) for device-type

// 全局声明
declare const page: any;
declare const axios: any;

export function register(Alpine: any, _root: Document) {
  Alpine.data('deviceType', () => ({
    // 设备数据
    allDevices: [],

    // 分页相关属性
    currentPage: 1,
    pageSize: 20,
    goToPageInput: 1,

    // 状态
    isLoading: false,
    isSaving: false,

    // 编辑状态 - 已移除内联编辑功能

    // 添加状态
    isAdding: false,

    // 验证错误
    errors: {
      general: ''
    },

    // 选择状态
    selectedDevices: [],

    // 计算属性 - 移除了编辑表单验证

    // 提供默认的计算属性，防止分页扩展未加载时报错
    get devices() {
      // 分页扩展会重写这个属性，这里是备用实现
      if (!this.allDevices || this.allDevices.length === 0) {
        return [];
      }
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      return this.allDevices.slice(startIndex, endIndex);
    },

    get totalItems() {
      return this.allDevices ? this.allDevices.length : 0;
    },

    get totalPages() {
      return Math.ceil(this.totalItems / this.pageSize) || 1;
    },

    get paginationItems() {
      // 分页扩展会重写这个属性，这里是备用实现
      const items: Array<{ type: string; value: number | string }> = [];
      const currentPage = this.currentPage;
      const totalPages = this.totalPages;

      if (totalPages <= 1) return items;

      // 简化的分页逻辑
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, currentPage + 2);

      if (start > 1) {
        items.push({ type: 'page', value: 1 });
        if (start > 2) {
          items.push({ type: 'ellipsis', value: '...' });
        }
      }

      for (let i = start; i <= end; i++) {
        items.push({ type: 'page', value: i });
      }

      if (end < totalPages) {
        if (end < totalPages - 1) {
          items.push({ type: 'ellipsis', value: '...' });
        }
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
        const response = await fetch('/devices/types');
        if (response.ok) {
          const result = await response.json();
          // API返回的格式是 { success: true, data: [...] }
          this.allDevices = result.data || [];
        } else {
          console.error('Failed to load devices');
          this.showError('加载设备数据失败');
        }
      } catch (error) {
        console.error('Error loading devices:', error);
        this.showError('加载设备数据失败');
      } finally {
        this.isLoading = false;
      }
    },

    // 编辑相关方法
    editDevice(index) {
      const actualIndex = (this.currentPage - 1) * this.pageSize + index;
      const device = this.allDevices[actualIndex];
      // 路由到编辑页面，使用设备ID
      page(`/device-type/edit/${device.id}`);
    },

    // 移除了内联编辑相关方法

    // 删除设备
    async deleteDevice(index) {
      if (!confirm('确定要删除这个设备类型吗？')) {
        return;
      }

      try {
        const actualIndex = (this.currentPage - 1) * this.pageSize + index;
        const device = this.allDevices[actualIndex];
        const response = await axios.post(`/devices/types/${device.id}/delete`);

        if (response.data.success) {
          this.allDevices.splice(actualIndex, 1);
          this.showSuccess('设备类型删除成功');

          // 如果当前页没有数据且不是第一页，回到上一页
          if (this.devices && this.devices.length === 0 && this.currentPage > 1) {
            this.currentPage--;
          }
        } else {
          this.showError(response.data.message || '删除失败');
        }
      } catch (error) {
        console.error('Error deleting device:', error);
        this.showError('删除设备类型失败');
      }
    },

    // 添加相关方法
    addDevice() {
      page('/device-type/add');
    },

    // 移除了内联添加功能（添加功能已移至独立页面）

    // 分页方法（分页扩展会重写这些方法）
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    // 选择相关方法
    toggleSelectAll() {
      // 使用当前页面的设备数据
      const currentDevices = this.devices || [];
      const allSelected = currentDevices.every(device => device.selected);
      currentDevices.forEach(device => {
        device.selected = !allSelected;
      });
    },

    async deleteSelected() {
      const selectedDevices = this.allDevices.filter(device => device.selected);
      if (selectedDevices.length === 0) {
        alert('请选择要删除的设备');
        return;
      }

      if (!confirm(`确定要删除选中的 ${selectedDevices.length} 个设备类型吗？`)) {
        return;
      }

      try {
        // 收集要删除的设备索引（从后往前删除，避免索引变化）
        const selectedIndices: number[] = [];
        this.allDevices.forEach((device, index) => {
          if (device.selected) {
            selectedIndices.push(index);
          }
        });

        // 从后往前删除，避免索引变化问题
        selectedIndices.sort((a, b) => b - a);

        // 使用Promise.all来并行删除所有选中的设备
        const deletePromises = selectedIndices.map(async (index) => {
          try {
            const device = this.allDevices[index];
            const response = await axios.post(`/devices/types/${device.id}/delete`);
            if (response.data.success) {
              return index;
            }
          } catch (error) {
            console.error(`删除设备索引 ${index} 失败:`, error);
          }
          return null;
        });

        const deletedIndices = await Promise.all(deletePromises);
        const successfulDeletes = deletedIndices.filter(index => index !== null);

        // 从本地数组中移除成功删除的设备（从后往前删除）
        successfulDeletes.forEach(index => {
          this.allDevices.splice(index, 1);
        });

        this.showSuccess(`成功删除 ${successfulDeletes.length} 个设备类型`);

        // 如果当前页没有数据且不是第一页，回到上一页
        if (this.devices && this.devices.length === 0 && this.currentPage > 1) {
          this.currentPage--;
        }
      } catch (error) {
        console.error('Error deleting devices:', error);
        this.showError('批量删除设备类型失败');
      }
    },

    // 移除了表单验证方法（编辑功能已移至独立页面）

    // 工具方法
    resetErrors() {
      this.errors = {
        general: ''
      };
    },

    showSuccess(message) {
      // 这里可以集成toast提示
      console.log('Success:', message);
      // TODO: 集成实际的提示组件
    },

    showError(message) {
      this.errors.general = message;
      console.error('Error:', message);
      // TODO: 集成实际的提示组件
    },

    // 辅助方法
    getStatusText(status) {
      return status ? '启用' : '禁用';
    },

    getStatusClass(status) {
      return status ? 'is-success' : 'is-danger';
    }
  }));
}
