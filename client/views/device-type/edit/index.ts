// 编辑设备类型页面脚本

// 直接声明全局变量，无需 window 前缀
declare const axios: any;
declare const Toastify: any;
declare const page: any;

export function register(Alpine: any, _root: Document) {
    Alpine.data('deviceTypeEdit', () => ({
        // 设备ID
        deviceId: null,

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
        isLoading: true,
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
            console.log('[DeviceTypeEdit] 编辑设备类型页面初始化');
            this.getDeviceIdFromUrl();
            this.loadDeviceData();
        },

        // 从URL获取设备ID
        getDeviceIdFromUrl() {
            // 尝试从hash获取设备ID (hashbang路由格式: #!/device-type/edit/xxx)
            const hash = window.location.hash;
            let matches = hash.match(/#!\/device-type\/edit\/([^\/\?]+)/);

            if (matches && matches[1]) {
                this.deviceId = matches[1];
                console.log('[DeviceTypeEdit] 从hash获取设备ID:', this.deviceId);
                return;
            }

            // 如果hash中没有，尝试从pathname获取
            const path = window.location.pathname;
            matches = path.match(/\/device-type\/edit\/([^\/\?]+)/);

            if (matches && matches[1]) {
                this.deviceId = matches[1];
                console.log('[DeviceTypeEdit] 从pathname获取设备ID:', this.deviceId);
                return;
            }

            // 如果都没有找到，尝试从URL的最后部分获取
            const urlParts = (hash || path).split('/');
            const lastPart = urlParts[urlParts.length - 1];

            if (lastPart && lastPart.trim() !== '') {
                this.deviceId = lastPart;
                console.log('[DeviceTypeEdit] 从URL最后部分获取设备ID:', this.deviceId);
                return;
            }

            console.error('[DeviceTypeEdit] 无法从URL获取设备ID', { hash, path, urlParts });
            this.cancel(); // 返回列表页
        },

        // 加载设备数据
        async loadDeviceData() {
            if (!this.deviceId) {
                console.error('[DeviceTypeEdit] 设备ID为空');
                return;
            }

            this.isLoading = true;

            try {
                const response = await axios.get(`/devices/types/${this.deviceId}`);

                if (response.data.success && response.data.data) {
                    const deviceData = response.data.data;

                    // 填充表单数据
                    this.form = {
                        name: deviceData.name || '',
                        code: deviceData.code || '',
                        status: deviceData.status !== undefined ? deviceData.status : true
                    };

                    // 填充点位数据
                    if (deviceData.points && Array.isArray(deviceData.points)) {
                        this.loadPointsData(deviceData.points);
                    }

                    console.log('[DeviceTypeEdit] 设备数据加载成功', deviceData);
                } else {
                    throw new Error('设备数据格式错误');
                }
            } catch (error) {
                console.error('[DeviceTypeEdit] 加载设备数据失败:', error);

                let errorMessage = '加载设备数据失败';
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
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
                this.isLoading = false;
            }
        },

        // 加载点位数据
        loadPointsData(points) {
            // 清空现有数据
            this.pointsDI = [];
            this.pointsDO = [];
            this.pointsAI = [];
            this.pointsAO = [];

            // 按类型分组点位数据
            points.forEach(point => {
                switch (point.type) {
                    case 'DI':
                        this.pointsDI.push({ ...point });
                        break;
                    case 'DO':
                        this.pointsDO.push({ ...point });
                        break;
                    case 'AI':
                        this.pointsAI.push({ ...point });
                        break;
                    case 'AO':
                        this.pointsAO.push({ ...point });
                        break;
                }
            });
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
            console.log('[DeviceTypeEdit] 提交表单');

            // 验证所有字段
            this.validateAllFields();

            if (!this.isFormValid) {
                console.log('[DeviceTypeEdit] 表单验证失败');
                return;
            }

            this.isSubmitting = true;

            try {
                // 合并所有类型的点位数据
                const allPoints = [
                    ...this.pointsDI,
                    ...this.pointsDO,
                    ...this.pointsAI,
                    ...this.pointsAO
                ];

                // 发送更新请求 - 使用POST方法
                const response = await axios.post(`/devices/types/${this.deviceId}`, {
                    name: this.form.name.trim(),
                    code: this.form.code.trim(),
                    status: this.form.status,
                    points: allPoints
                });

                if (response.data.success) {
                    console.log('[DeviceTypeEdit] 更新成功');

                    // 显示成功提示
                    this.showSuccess = true;

                    // 显示成功提示
                    if (Toastify) {
                        Toastify({
                            text: "设备类型更新成功",
                            duration: 3000,
                            gravity: "top",
                            position: "center",
                            backgroundColor: "#28a745",
                        }).showToast();
                    }

                    // 2秒后自动返回列表页
                    setTimeout(() => {
                        this.cancel();
                    }, 2000);
                } else {
                    throw new Error(response.data.message || '更新失败');
                }
            } catch (error) {
                console.error('[DeviceTypeEdit] 更新失败:', error);

                let errorMessage = '更新设备类型失败';
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
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

        // 取消/返回
        cancel() {
            console.log('[DeviceTypeEdit] 取消编辑，返回列表');
            page('/device-type')
        },

        // 点位配置相关方法

        // 切换tab
        switchTab(tabType) {
            this.activeTab = tabType;
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

            const newPoint = {
                id: Date.now() + Math.random(), // 确保唯一性
                type: targetType,
                code: '',
                statusFeedback: '',
                value: pointsArray.length
            };

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