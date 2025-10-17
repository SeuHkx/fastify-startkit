// 添加设备类型页面脚本

// 直接声明全局变量，无需 window 前缀
declare const axios: any;
declare const Toastify: any;
declare const page: any;

export function register(Alpine: any, _root: Document) {
    Alpine.data('deviceTypeAdd', () => ({
        // 表单数据
        form: {
            name: '',
            code: '',
            status: true
        },
        
        // 点位配置数据 - 为每种类型独立存储
        points: [], // 保留原有的points数组用于提交
        pointsDI: [],
        pointsDO: [],
        pointsAI: [],
        pointsAO: [],
        
        // 每种点位类型的选中状态
        selectedPoints: [],
        selectedPointsDI: [],
        selectedPointsDO: [],
        selectedPointsAI: [],
        selectedPointsAO: [],
        
        // 当前选中的tab
        activeTab: 'DI',
        
        // 状态
        isSubmitting: false,
        showSuccess: false,
        
        // 验证错误
        errors: {
            name: '',
            code: ''
        },
        
        // 计算属性：表单是否有效
        get isFormValid() {
            return this.form.name.trim() !== '' && 
                   this.form.code.trim() !== '' && 
                   !this.errors.name && 
                   !this.errors.code;
        },
        
        // 计算属性：是否全选点位 - 每种类型独立
        get isAllPointsSelectedDI() {
            return this.pointsDI.length > 0 && this.selectedPointsDI.length === this.pointsDI.length;
        },
        get isAllPointsSelectedDO() {
            return this.pointsDO.length > 0 && this.selectedPointsDO.length === this.pointsDO.length;
        },
        get isAllPointsSelectedAI() {
            return this.pointsAI.length > 0 && this.selectedPointsAI.length === this.pointsAI.length;
        },
        get isAllPointsSelectedAO() {
            return this.pointsAO.length > 0 && this.selectedPointsAO.length === this.pointsAO.length;
        },
        
        // 计算属性：根据当前tab筛选点位（保留用于兼容）
        get filteredPoints() {
            switch (this.activeTab) {
                case 'DI': return this.pointsDI;
                case 'DO': return this.pointsDO;
                case 'AI': return this.pointsAI;
                case 'AO': return this.pointsAO;
                default: return [];
            }
        },
                
        // 初始化
        init() {
            console.log('[DeviceTypeAdd] 添加设备类型页面初始化');
            // 表格初始化为空，不添加默认点位
        },
        
        // 验证单个字段
        validateField(fieldName) {
            this.errors[fieldName] = '';
            
            switch (fieldName) {
                case 'name':
                    if (!this.form.name.trim()) {
                        this.errors.name = '设备类型名称不能为空';
                    } else if (this.form.name.trim().length < 2) {
                        this.errors.name = '设备类型名称至少2个字符';
                    } else if (this.form.name.trim().length > 50) {
                        this.errors.name = '设备类型名称不能超过50个字符';
                    }
                    break;
                    
                case 'code':
                    if (!this.form.code.trim()) {
                        this.errors.code = '设备类型编码不能为空';
                    } else if (this.form.code.trim().length < 1) {
                        this.errors.code = '设备类型编码至少1个字符';
                    } else if (this.form.code.trim().length > 20) {
                        this.errors.code = '设备类型编码不能超过20个字符';
                    }
                    break;
            }
        },
        
        // 清除错误
        clearError(fieldName) {
            this.errors[fieldName] = '';
        },
        
        // 验证所有字段
        validateAllFields() {
            this.validateField('name');
            this.validateField('code');
        },
        
        // 提交表单
        async submitForm() {
            console.log('[DeviceTypeAdd] 提交表单');
            
            // 验证所有字段
            this.validateAllFields();
            
            if (!this.isFormValid) {
                console.log('[DeviceTypeAdd] 表单验证失败');
                return;
            }
            
            this.isSubmitting = true;
            
            try {
                // 优化各类型点位数据的字段类型
                const optimizedPointsDI = this.optimizePointsArray(this.pointsDI);
                const optimizedPointsDO = this.optimizePointsArray(this.pointsDO);
                const optimizedPointsAI = this.optimizePointsArray(this.pointsAI);
                const optimizedPointsAO = this.optimizePointsArray(this.pointsAO);
                
                // 合并所有类型的点位数据
                const allPoints = [
                    ...optimizedPointsDI,
                    ...optimizedPointsDO,
                    ...optimizedPointsAI,
                    ...optimizedPointsAO
                ];
                
                // 发送添加请求
                const response = await axios.post('/devices/types', {
                    name: this.form.name.trim(),
                    code: this.form.code.trim(),
                    status: this.form.status,
                    points: allPoints
                });
                
                if (response.data.success) {
                    console.log('[DeviceTypeAdd] 添加成功');
                    
                    // 显示成功提示
                    this.showSuccess = true;
                    
                    // 重置表单
                    this.resetForm();
                    
                    // 3秒后自动返回列表页
                    setTimeout(() => {
                        this.cancel();
                    }, 2000);
                    
                    // 显示成功提示
                    if (Toastify) {
                        Toastify({
                            text: "设备类型添加成功",
                            duration: 3000,
                            gravity: "top",
                            position: "center",
                            backgroundColor: "#28a745",
                        }).showToast();
                    }
                } else {
                    throw new Error(response.data.message || '添加失败');
                }
            } catch (error) {
                console.error('[DeviceTypeAdd] 添加失败:', error);
                
                let errorMessage = '添加设备类型失败';
                // @ts-ignore
                if (error.response?.data?.message) {
                    // @ts-ignore
                    errorMessage = error.response.data.message;
                } else { // @ts-ignore
                    if (error.message) {
                        // @ts-ignore
                        errorMessage = error.message;
                    }
                }
                
                // 显示错误提示
                if (Toastify) {
                    Toastify({
                        text: errorMessage,
                        duration: 3000,
                        gravity: "top",
                        position: "center",
                        backgroundColor: "#dc3545",
                    }).showToast();
                }
            } finally {
                this.isSubmitting = false;
            }
        },
        
        // 重置表单
        resetForm() {
            this.form = {
                name: '',
                code: '',
                status: true
            };
            
            this.errors = {
                name: '',
                code: ''
            };
            
            // 重置所有点位数据
            this.points = [];
            this.pointsDI = [];
            this.pointsDO = [];
            this.pointsAI = [];
            this.pointsAO = [];
            
            // 重置所有选中状态
            this.selectedPoints = [];
            this.selectedPointsDI = [];
            this.selectedPointsDO = [];
            this.selectedPointsAI = [];
            this.selectedPointsAO = [];
        },
        
        // 取消/返回
        cancel() {
            console.log('[DeviceTypeAdd] 取消添加，返回列表');
            
            // 使用page路由返回到设备类型管理页面
            page('/device-type');
        },
        
        // 点位配置相关方法
        
        // 优化点位数据类型 - 将 status 和 action 字段转换为合适的类型
        optimizePointData(point: any) {
            // 处理 status 字段（DI 类型使用）
            if (point.hasOwnProperty('status')) {
                const statusValue = point.status;
                if (typeof statusValue === 'string' && statusValue.trim() !== '') {
                    // 检查是否为纯数字字符串
                    const numValue = Number(statusValue);
                    if (!isNaN(numValue) && isFinite(numValue)) {
                        point.status = numValue;
                    }
                    // 如果不是数字，保持字符串不变
                }
            }
            
            // 处理 action 字段（DO 类型使用）
            if (point.hasOwnProperty('action')) {
                const actionValue = point.action;
                if (typeof actionValue === 'string' && actionValue.trim() !== '') {
                    // 检查是否为纯数字字符串
                    const numValue = Number(actionValue);
                    if (!isNaN(numValue) && isFinite(numValue)) {
                        point.action = numValue;
                    }
                    // 如果不是数字，保持字符串不变
                }
            }
            
            return point;
        },
        
        // 批量优化点位数组的数据类型
        optimizePointsArray(pointsArray: any[]) {
            return pointsArray.map(point => this.optimizePointData(point));
        },
        
        // 实时优化单个点位的字段类型（用于输入框失焦时调用）
        optimizePointField(pointType: string, index: number, fieldName: string) {
            const pointsArray = this.getPointsArray(pointType);
            if (index >= 0 && index < pointsArray.length) {
                const point = pointsArray[index];
                if (fieldName === 'status' || fieldName === 'action') {
                    this.optimizePointData(point);
                }
            }
        },
        
        // 切换tab
        switchTab(tabType) {
            this.activeTab = tabType;
            // 不需要清空选中状态，因为每个tab有独立的选中状态
        },
        
        // 获取指定类型的点位数组
        getPointsArray(pointType) {
            switch (pointType) {
                case 'DI': return this.pointsDI;
                case 'DO': return this.pointsDO;
                case 'AI': return this.pointsAI;
                case 'AO': return this.pointsAO;
                default: return [];
            }
        },
        
        // 获取指定类型的选中数组
        getSelectedArray(pointType) {
            switch (pointType) {
                case 'DI': return this.selectedPointsDI;
                case 'DO': return this.selectedPointsDO;
                case 'AI': return this.selectedPointsAI;
                case 'AO': return this.selectedPointsAO;
                default: return [];
            }
        },
        
        // 添加点位 - 支持指定类型或使用当前tab
        addPoint(pointType = null) {
            const targetType = pointType || this.activeTab;
            const pointsArray = this.getPointsArray(targetType);
            
            const newPoint: any = {
                id: Date.now() + Math.random(), // 确保唯一性
                type: targetType,
                statusCode: '',
                statusFeedback: '',
                value: pointsArray.length
            };
            
            // 根据点位类型添加特定字段
            if (targetType === 'DI') {
                newPoint.status = 0; // DI 类型使用 status 字段，默认为数字 0
            } else if (targetType === 'DO') {
                newPoint.action = 0; // DO 类型使用 action 字段，默认为数字 0
            }
            
            pointsArray.push(newPoint);
        },
        
        // 删除点位 - 支持指定类型
        deletePoint(pointType, index) {
            const pointsArray = this.getPointsArray(pointType);
            const selectedArray = this.getSelectedArray(pointType);
            
            if (index >= 0 && index < pointsArray.length) {
                const pointToDelete = pointsArray[index];
                pointsArray.splice(index, 1);
                
                // 从选中数组中移除
                const selectedIndex = selectedArray.indexOf(pointToDelete.id);
                if (selectedIndex > -1) {
                    selectedArray.splice(selectedIndex, 1);
                }
            }
        },
        
        // 编辑点位
        editPoint(pointType, index) {
            const pointsArray = this.getPointsArray(pointType);
            console.log('编辑点位:', pointsArray[index]);
            // 这里可以打开编辑弹窗或跳转到编辑页面
        },
        
        // 删除选中的点位 - 支持指定类型
        deleteSelectedPoints(pointType) {
            const pointsArray = this.getPointsArray(pointType);
            const selectedArray = this.getSelectedArray(pointType);
            
            if (selectedArray.length === 0) return;
            
            // 从后往前删除，避免索引变化问题
            for (let i = pointsArray.length - 1; i >= 0; i--) {
                if (selectedArray.includes(pointsArray[i].id)) {
                    pointsArray.splice(i, 1);
                }
            }
            
            // 清空选中状态
            selectedArray.length = 0;
        },
        
        // 全选/取消全选点位 - 支持指定类型
        toggleAllPoints(pointType: string, event: any = null) {
            const pointsArray = this.getPointsArray(pointType);
            const selectedArray = this.getSelectedArray(pointType);
            
            // 如果有event参数，使用event.target.checked，否则基于当前状态切换
            const shouldSelect = event ? event.target.checked : selectedArray.length !== pointsArray.length;
            
            if (shouldSelect) {
                // 全选：添加所有点位ID到选中数组
                selectedArray.length = 0;
                selectedArray.push(...pointsArray.map(point => point.id));
            } else {
                // 取消全选：清空选中数组
                selectedArray.length = 0;
            }
        }
    }));
}