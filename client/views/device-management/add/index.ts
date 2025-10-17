// auto scaffolded page script (TS) for device-management/add

// 全局声明
declare const axios: any;
declare const Toastify: any;
declare const page: any;

// 类型定义
interface PointConfig {
    id: number | string;
    type: 'DI' | 'DO' | 'AI' | 'AO';
    code: string;
    statusCode?: string;
    statusFeedback: string;
    value: number;
    status?: string;
    action?: string;
    channel?: string;
    bit?: number; // 新增bit字段
    isFromTemplate?: boolean;
    _key?: string;
}

interface DeviceType {
    id: string;
    name: string;
    code: string;
    status: boolean;
    points: PointConfig[];
}

export function register(Alpine: any, _root: Document) {
    Alpine.data('deviceAdd', () => ({
        // 表单数据
        form: {
            type: '',
            name: '',
            conaddr: '',
            retadd: '',
        },

        // 错误信息
        errors: {
            type: '',
            name: '',
            conaddr: '',
            retadd: '',
        },

        // 设备类型列表
        deviceTypes: [] as DeviceType[],
        
        // 点位配置数据 - 按类型分类存储
        pointsDI: [] as PointConfig[],
        pointsDO: [] as PointConfig[],
        pointsAI: [] as PointConfig[],
        pointsAO: [] as PointConfig[],

        // 每种点位类型的选中状态
        selectedPointsDI: [] as (number | string)[],
        selectedPointsDO: [] as (number | string)[],
        selectedPointsAI: [] as (number | string)[],
        selectedPointsAO: [] as (number | string)[],

        // 当前选中的tab
        activeTab: 'DI',

        // 状态
        isLoading: false,
        isSubmitting: false,
        showSuccess: false,

        // 计算属性 - 是否全选点位 - 每种类型独立
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

        // 计算属性 - 表单是否有效
        get isFormValid() {
            return this.form.type !== '' &&
                this.form.name.trim() !== '' &&
                this.form.conaddr.trim() !== '' &&
                this.form.retadd.trim() !== '' &&
                !this.hasErrors;
        },

        // 计算属性 - 是否有错误
        get hasErrors() {
            return Object.values(this.errors).some(error => error !== '');
        },

        // 初始化
        init() {
            console.log('[DeviceAdd] 页面初始化');
            this.loadDeviceTypes();
        },

        // 加载设备类型列表
        async loadDeviceTypes() {
            this.isLoading = true;
            try {
                const response = await axios.get('/devices/types');
                if (response.data.success) {
                    this.deviceTypes = response.data.data || [];
                    console.log('[DeviceAdd] 设备类型加载成功:', this.deviceTypes);
                } else {
                    console.error('Failed to load device types');
                    this.showError('加载设备类型失败');
                }
            } catch (error) {
                console.error('Error loading device types:', error);
                this.showError('加载设备类型失败');
            } finally {
                this.isLoading = false;
            }
        },

        // 当设备类型改变时，不自动加载点位配置
        onDeviceTypeChange() {
            console.log('[DeviceAdd] 设备类型改变:', this.form.type);
            // 设备类型改变时不自动加载配置，需要用户手动点击"导入默认配置"
        },

        // 手动导入默认配置（不覆盖已有点位）
        importDefaultPoints() {
            console.log('[DeviceAdd] 手动导入默认配置');

            if (!this.form.type) {
                console.warn('[DeviceAdd] 未选择设备类型');
                return;
            }

            // 找到选中的设备类型
            const selectedDeviceType = this.deviceTypes.find((type: any) => type.id === this.form.type);
            if (!selectedDeviceType || !selectedDeviceType.points) {
                console.warn('[DeviceAdd] 设备类型没有点位配置');
                return;
            }

            // 获取当前已有的点位配置
            const currentAll = [
                ...this.pointsDI,
                ...this.pointsDO,
                ...this.pointsAI,
                ...this.pointsAO
            ];

            // 建立现有点位的键集合
            const existingKeys = new Set<string>();
            currentAll.forEach((point: any) => {
                const key = `${point.type}::${point.code || point.statusCode}`;
                existingKeys.add(key);
            });

            // 从模板导入不存在的点位
            const newPoints: any[] = [];
            selectedDeviceType.points.forEach((point: any, i: number) => {
                const key = `${point.type}::${point.code || point.statusCode}`;
                
                // 只导入不存在的点位
                if (!existingKeys.has(key)) {
                    const uid = `ind-${point.type || 'PT'}-${i}-${Math.random().toString(36).slice(2,8)}`;
                    newPoints.push({
                        id: uid,
                        _key: uid,
                        type: point.type,
                        code: point.code,
                        statusCode: point.statusCode || point.code,
                        statusFeedback: point.statusFeedback,
                        value: point.value,
                        status: point.status,
                        action: point.action,
                        channel: '请选择',
                        bit: point.bit || 0, // 支持bit字段
                        isFromTemplate: false
                    });
                }
            });

            // 将新点位添加到现有配置中
            const allCurrentPoints = [
                ...this.pointsDI,
                ...this.pointsDO,
                ...this.pointsAI,
                ...this.pointsAO
            ];
            const combinedPoints = [...allCurrentPoints, ...newPoints];

            // 重新分组点位数据
            this.loadPointsData(combinedPoints);

            console.log(`[DeviceAdd] 成功导入 ${newPoints.length} 个新点位配置`);
        },

        // 加载点位数据
        loadPointsData(points: any[]) {
            // 清空现有数据
            this.pointsDI = [];
            this.pointsDO = [];
            this.pointsAI = [];
            this.pointsAO = [];

            const safe: any[] = Array.isArray(points) ? points : [];
            // 按类型分组点位数据，并补齐唯一键
            safe.forEach((point: any, idx: number) => {
                if (!point) return;
                if (!point.id) {
                    const gen = `${point.type || 'PT'}-${idx}-${Math.random().toString(36).slice(2,6)}`;
                    point.id = gen;
                }
                if (!point._key) point._key = point.id;
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

        // 切换tab
        switchTab(tabType: string) {
            this.activeTab = tabType;
        },

        // 获取指定类型的点位数组
        getPointsArray(pointType: string) {
            switch (pointType) {
                case 'DI': return this.pointsDI;
                case 'DO': return this.pointsDO;
                case 'AI': return this.pointsAI;
                case 'AO': return this.pointsAO;
                default: return [];
            }
        },

        // 获取指定类型的选中数组
        getSelectedArray(pointType: string) {
            switch (pointType) {
                case 'DI': return this.selectedPointsDI;
                case 'DO': return this.selectedPointsDO;
                case 'AI': return this.selectedPointsAI;
                case 'AO': return this.selectedPointsAO;
                default: return [];
            }
        },

        // 添加点位 - 支持指定类型或使用当前tab
        addPoint(pointType: string = '') {
            const targetType = pointType || this.activeTab;
            const pointsArray = this.getPointsArray(targetType);

            const uid = `new-${targetType}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
            const newPoint: PointConfig = {
                id: uid, // 使用更好的唯一ID
                _key: uid, // 添加_key字段供Alpine.js使用
                type: targetType as 'DI' | 'DO' | 'AI' | 'AO',
                code: '',
                statusCode: '',
                statusFeedback: '',
                value: pointsArray.length,
                status: '',
                action: '',
                channel: '请选择',
                bit: 0, // 添加bit字段
                isFromTemplate: false // 手动添加的点位可以编辑
            };

            pointsArray.push(newPoint);
        },

        // 删除点位 - 支持指定类型
        deletePoint(pointType: string, index: number) {
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

        // 删除选中的点位 - 支持指定类型
        deleteSelectedPoints(pointType: string) {
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
                selectedArray.push(...pointsArray.map((point: any) => point.id));
            } else {
                // 取消全选：清空选中数组
                selectedArray.length = 0;
            }
        },

        // 优化点位字段
        optimizePointField(pointType: string, index: number, fieldName: string) {
            const pointsArray = this.getPointsArray(pointType);
            if (index >= 0 && index < pointsArray.length) {
                const point = pointsArray[index];
                console.log(`[DeviceAdd] 优化点位字段: ${pointType}[${index}].${fieldName} = ${(point as any)[fieldName]}`);
                // 这里可以添加字段优化逻辑
            }
        },

        // 验证单个字段
        validateField(fieldName: string) {
            console.log(`[DeviceAdd] 验证字段: ${fieldName}`);

            switch (fieldName) {
                case 'type':
                    if (!this.form.type) {
                        this.errors.type = '请选择设备类型';
                    } else {
                        this.errors.type = '';
                    }
                    break;

                case 'name':
                    if (!this.form.name.trim()) {
                        this.errors.name = '设备类型名称不能为空';
                    } else if (this.form.name.trim().length < 2) {
                        this.errors.name = '设备类型名称至少需要2个字符';
                    } else if (this.form.name.trim().length > 100) {
                        this.errors.name = '设备类型名称不能超过100个字符';
                    } else {
                        this.errors.name = '';
                    }
                    break;
                case 'conaddr':
                    if (!this.form.conaddr.trim()) {
                        this.errors.conaddr = '控制地址不能为空';
                    } else {
                        this.errors.conaddr = '';
                    }
                    break;

                case 'retadd':
                    if (!this.form.retadd.trim()) {
                        this.errors.retadd = '反馈地址不能为空';
                    } else {
                        this.errors.retadd = '';
                    }
                    break;
            }
        },

        // 清除单个字段错误
        clearError(fieldName: string) {
            // @ts-ignore
            this.errors[fieldName] = '';
        },

        // 从当前配置创建独立点位配置
        createIndependentPoints() {
            const allCurrentPoints = [
                ...this.pointsDI,
                ...this.pointsDO,
                ...this.pointsAI,
                ...this.pointsAO
            ];
            
            return allCurrentPoints.map(point => ({
                type: point.type,
                code: point.code,
                statusCode: point.statusCode || point.code,
                statusFeedback: point.statusFeedback,
                value: point.value,
                status: point.status,
                action: point.action,
                channel: point.channel,
                bit: point.bit || 0 // 支持bit字段
            }));
        },

        // 验证所有字段
        validateAllFields() {
            console.log('[DeviceAdd] 验证字段');
            this.validateField('type');
            this.validateField('name');
            this.validateField('conaddr');
            this.validateField('retadd');
        },

        // 提交表单
        async submitForm() {
            console.log('[DeviceAdd] 提交表单');

            // 验证所有字段
            this.validateAllFields();

            if (!this.isFormValid) {
                console.log('[DeviceAdd] 表单验证失败');
                return;
            }

            this.isSubmitting = true;

            try {
                // 获取选中的设备类型信息
                const selectedDeviceType = this.deviceTypes.find(type => type.id === this.form.type);

                // 计算点位数量
                const DINum = this.pointsDI.length;
                const DONum = this.pointsDO.length;
                const AINum = this.pointsAI.length;
                const AONum = this.pointsAO.length;

                // 合并所有类型的点位
                const allPoints = [
                    ...this.pointsDI,
                    ...this.pointsDO,
                    ...this.pointsAI,
                    ...this.pointsAO
                ];

                // 构建添加数据
                let addData: any = {
                    name: this.form.name.trim(),
                    deviceTypeId: this.form.type,
                    conaddr: this.form.conaddr.trim(),
                    retadd: this.form.retadd.trim(),
                    independentPoints: this.createIndependentPoints()
                };

                console.log('[DeviceAdd] 提交独立点位配置，点位数量:', addData.independentPoints.length);

                // 发送添加请求 - 创建设备实例
                const response = await axios.post('/device-instances', addData);

                if (response.data.success) {
                    console.log('[DeviceAdd] 添加成功');

                    // 显示成功提示
                    this.showSuccess = true;

                    // 重置表单
                    this.resetForm();

                    // 3秒后自动返回列表页
                    setTimeout(() => {
                        this.cancel();
                    }, 2000);

                    // 显示成功提示
                    if (typeof Toastify !== 'undefined') {
                        Toastify({
                            text: "设备添加成功",
                            duration: 3000,
                            gravity: "top",
                            position: "center",
                            backgroundColor: "#28a745",
                        }).showToast();
                    }
                } else {
                    throw new Error(response.data.message || '添加失败');
                }
            } catch (error: any) {
                console.error('[DeviceAdd] 添加失败:', error);

                let errorMessage = '添加设备失败';
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                // 显示错误提示
                if (typeof Toastify !== 'undefined') {
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
                type: '',
                name: '',
                conaddr: '',
                retadd: ''
            };

            this.errors = {
                type: '',
                name: '',
                conaddr: '',
                retadd: ''
            };

            this.pointsDI = [];
            this.pointsDO = [];
            this.pointsAI = [];
            this.pointsAO = [];
            
            this.selectedPointsDI = [];
            this.selectedPointsDO = [];
            this.selectedPointsAI = [];
            this.selectedPointsAO = [];
            
            this.activeTab = 'DI';
        },

        // 显示错误信息
        showError(message: string) {
            if (typeof Toastify !== 'undefined') {
                Toastify({
                    text: message,
                    duration: 3000,
                    gravity: "top",
                    position: "center",
                    backgroundColor: "#dc3545",
                }).showToast();
            }
        },

        // 取消/返回
        cancel() {
            console.log('[DeviceAdd] 取消添加，返回列表');

            // 使用路由返回到设备管理页面
            if (typeof page !== 'undefined') {
                page('/device-management');
            }
        }
    }));
}