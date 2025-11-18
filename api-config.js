// API配置文件 - 用于连接到北辰幼儿园管理系统
const API_CONFIG = {
    baseURL: 'http://localhost:8891',

    // 自动登录凭证（后台自动获取token用）
    credentials: {
        email: 'admin@beichen.com',
        password: 'admin123'
    },

    endpoints: {
        // 认证
        login: '/api/auth/login',

        // 每日观察记录
        dailyObservation: '/api/records/daily-observation',

        // 值班播报记录
        dutyReport: '/api/records/duty-report',

        // 关联数据
        campus: '/api/campus',
        classes: '/api/classes',
        teachers: '/api/users?role=TEACHER&pageSize=1000',
        leaders: '/api/users?role=TEACHER&pageSize=1000'  // 值班领导（暂用教师列表）
    }
};

// Token管理
class TokenManager {
    static TOKEN_KEY = 'beichen_auth_token';

    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    static removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
    }

    static isAuthenticated() {
        return !!this.getToken();
    }
}

// API客户端
class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
        this.autoLoginPromise = null;
    }

    // 自动登录获取token
    async autoLogin() {
        try {
            console.log('正在自动获取访问令牌...');
            console.log('登录地址:', `${this.baseURL}${API_CONFIG.endpoints.login}`);
            console.log('登录账号:', API_CONFIG.credentials.email);

            const response = await fetch(`${this.baseURL}${API_CONFIG.endpoints.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(API_CONFIG.credentials)
            });

            console.log('登录响应状态:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('登录失败响应:', errorText);
                throw new Error(`自动登录失败: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('登录响应数据:', data);

            if (data.access_token) {
                TokenManager.setToken(data.access_token);
                console.log('✅ 访问令牌获取成功');
                return data.access_token;
            }

            if (data.accessToken) {
                TokenManager.setToken(data.accessToken);
                console.log('✅ 访问令牌获取成功');
                return data.accessToken;
            }

            throw new Error('未获取到访问令牌，响应中没有access_token字段');
        } catch (error) {
            console.error('❌ 自动登录错误:', error);
            console.error('请检查：');
            console.error('1. 后端服务器是否运行在', this.baseURL);
            console.error('2. 登录端点是否正确:', API_CONFIG.endpoints.login);
            console.error('3. 账号密码是否正确:', API_CONFIG.credentials.email);
            throw error;
        }
    }

    // 确保有有效的token
    async ensureAuthenticated() {
        // 如果正在登录，等待登录完成
        if (this.autoLoginPromise) {
            return await this.autoLoginPromise;
        }

        let token = TokenManager.getToken();

        // 如果没有token，自动登录获取
        if (!token) {
            this.autoLoginPromise = this.autoLogin();
            try {
                token = await this.autoLoginPromise;
            } finally {
                this.autoLoginPromise = null;
            }
        }

        return token;
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        // 确保有token
        await this.ensureAuthenticated();
        const token = TokenManager.getToken();

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        // 添加token到请求头
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);

            // 如果是401未授权，清除token并重试一次
            if (response.status === 401) {
                console.log('Token已失效，重新获取...');
                TokenManager.removeToken();
                await this.autoLogin();

                // 重新发起请求
                const newToken = TokenManager.getToken();
                config.headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(url, config);

                if (!retryResponse.ok) {
                    const error = await retryResponse.json().catch(() => ({}));
                    throw new Error(error.message || `请求失败: ${retryResponse.status}`);
                }

                if (retryResponse.status === 204) {
                    return { success: true };
                }

                return await retryResponse.json();
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `请求失败: ${response.status}`);
            }

            // 如果是DELETE请求且返回204，返回成功标志
            if (response.status === 204) {
                return { success: true };
            }

            return await response.json();
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    // 认证相关
    async login(email, password) {
        const response = await this.request(API_CONFIG.endpoints.login, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.access_token) {
            TokenManager.setToken(response.access_token);
        }

        return response;
    }

    logout() {
        TokenManager.removeToken();
    }

    // 获取关联数据
    async getCampusList() {
        try {
            const data = await this.request(API_CONFIG.endpoints.campus);
            console.log('园区数据:', data);
            return data;
        } catch (error) {
            console.error('获取园区列表失败:', error);
            throw error;
        }
    }

    async getClassesList() {
        try {
            const data = await this.request(API_CONFIG.endpoints.classes);
            console.log('班级数据:', data);
            return data;
        } catch (error) {
            console.error('获取班级列表失败:', error);
            throw error;
        }
    }

    async getTeachersList() {
        try {
            const data = await this.request(API_CONFIG.endpoints.teachers);
            console.log('教师数据:', data);
            // 如果返回的是分页数据，提取data字段
            return data;
        } catch (error) {
            console.error('获取教师列表失败:', error);
            throw error;
        }
    }

    async getLeadersList() {
        try {
            const data = await this.request(API_CONFIG.endpoints.leaders);
            console.log('领导数据:', data);
            return data;
        } catch (error) {
            console.error('获取领导列表失败:', error);
            throw error;
        }
    }

    // 每日观察记录相关
    async createDailyObservation(data) {
        return await this.request(API_CONFIG.endpoints.dailyObservation, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getDailyObservations(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString
            ? `${API_CONFIG.endpoints.dailyObservation}?${queryString}`
            : API_CONFIG.endpoints.dailyObservation;

        console.log('请求观察记录列表:', endpoint);
        const data = await this.request(endpoint);
        console.log('获取到的观察记录:', data);
        return data;
    }

    async getDailyObservationById(id) {
        return await this.request(`${API_CONFIG.endpoints.dailyObservation}/${id}`);
    }

    async updateDailyObservation(id, data) {
        return await this.request(`${API_CONFIG.endpoints.dailyObservation}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteDailyObservation(id) {
        return await this.request(`${API_CONFIG.endpoints.dailyObservation}/${id}`, {
            method: 'DELETE'
        });
    }

    // 值班播报记录相关
    async createDutyReport(data) {
        return await this.request(API_CONFIG.endpoints.dutyReport, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getDutyReports(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString
            ? `${API_CONFIG.endpoints.dutyReport}?${queryString}`
            : API_CONFIG.endpoints.dutyReport;

        console.log('请求值班播报记录列表:', endpoint);
        const data = await this.request(endpoint);
        console.log('获取到的值班播报记录:', data);
        return data;
    }

    async getDutyReportById(id) {
        return await this.request(`${API_CONFIG.endpoints.dutyReport}/${id}`);
    }

    async updateDutyReport(id, data) {
        return await this.request(`${API_CONFIG.endpoints.dutyReport}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteDutyReport(id) {
        return await this.request(`${API_CONFIG.endpoints.dutyReport}/${id}`, {
            method: 'DELETE'
        });
    }
}

// 数据转换工具
class DataTransformer {
    // 缓存关联数据
    static cache = {
        campuses: null,
        classes: null,
        teachers: null,
        leaders: null
    };

    // 加载所有关联数据
    static async loadReferenceData(apiClient) {
        try {
            if (!this.cache.campuses) {
                this.cache.campuses = await apiClient.getCampusList();
                console.log(`✅ 已加载 ${this.cache.campuses.length} 个园区`);
            }
            if (!this.cache.classes) {
                this.cache.classes = await apiClient.getClassesList();
                console.log(`✅ 已加载 ${this.cache.classes.length} 个班级`);
            }
            if (!this.cache.teachers) {
                this.cache.teachers = await apiClient.getTeachersList();
                // 如果是分页数据，从data字段获取长度
                const teacherCount = this.cache.teachers.data ? this.cache.teachers.data.length : this.cache.teachers.length;
                console.log(`✅ 已加载 ${teacherCount} 个教师`);
            }
            if (!this.cache.leaders) {
                this.cache.leaders = await apiClient.getLeadersList();
                const leaderCount = this.cache.leaders.data ? this.cache.leaders.data.length : this.cache.leaders.length;
                console.log(`✅ 已加载 ${leaderCount} 个领导`);
            }
            return this.cache;
        } catch (error) {
            console.error('❌ 加载关联数据失败:', error);
            throw error;
        }
    }

    // 根据名称查找ID
    static findCampusIdByName(name) {
        if (!this.cache.campuses) return null;
        const campus = this.cache.campuses.find(c => c.name === name);
        return campus ? campus.id : null;
    }

    static findClassIdByName(name) {
        if (!this.cache.classes) return null;
        const cls = this.cache.classes.find(c => c.name === name);
        return cls ? cls.id : null;
    }

    static findTeacherIdByName(name) {
        if (!this.cache.teachers) return null;
        // 如果是分页数据，从data字段获取
        const teacherList = this.cache.teachers.data || this.cache.teachers;
        const teacher = teacherList.find(t => t.name === name);
        return teacher ? teacher.id : null;
    }

    // 根据ID查找名称
    static findCampusNameById(id) {
        if (!this.cache.campuses) return null;
        const campus = this.cache.campuses.find(c => c.id === id);
        return campus ? campus.name : null;
    }

    static findClassNameById(id) {
        if (!this.cache.classes) return null;
        const cls = this.cache.classes.find(c => c.id === id);
        return cls ? cls.name : null;
    }

    static findTeacherNameById(id) {
        if (!this.cache.teachers) return null;
        // 如果是分页数据，从data字段获取
        const teacherList = this.cache.teachers.data || this.cache.teachers;
        const teacher = teacherList.find(t => t.id === id);
        return teacher ? teacher.name : null;
    }

    static findLeaderIdByName(name) {
        if (!this.cache.leaders) return null;
        const leaderList = this.cache.leaders.data || this.cache.leaders;
        const leader = leaderList.find(l => l.name === name);
        return leader ? leader.id : null;
    }

    static findLeaderNameById(id) {
        if (!this.cache.leaders) return null;
        const leaderList = this.cache.leaders.data || this.cache.leaders;
        const leader = leaderList.find(l => l.id === id);
        return leader ? leader.name : null;
    }

    // 将旧格式转换为新API格式
    static transformToNewFormat(oldData) {
        console.log('开始转换数据:', oldData);
        const teacherCount = this.cache.teachers?.data ? this.cache.teachers.data.length : (this.cache.teachers?.length || 0);
        console.log('缓存状态:', {
            campuses: this.cache.campuses?.length || 0,
            classes: this.cache.classes?.length || 0,
            teachers: teacherCount
        });

        const teacherId = this.findTeacherIdByName(oldData.teacher);
        const classId = this.findClassIdByName(oldData.class);
        const campusId = this.findCampusIdByName(oldData.school);

        console.log('查找结果:', { teacherId, classId, campusId });

        if (!teacherId) {
            console.error('找不到教师:', oldData.teacher);
            const teacherList = this.cache.teachers.data || this.cache.teachers;
            console.error('可用教师列表:', teacherList);
            throw new Error(`找不到教师"${oldData.teacher}"的ID，请确保后端数据库中存在该教师`);
        }

        if (!classId) {
            console.error('找不到班级:', oldData.class);
            console.error('可用班级列表:', this.cache.classes);
            throw new Error(`找不到班级"${oldData.class}"的ID，请确保后端数据库中存在该班级`);
        }

        return {
            date: oldData.date,
            weather: oldData.weather,
            teacherId: teacherId,
            classId: classId,
            campusId: campusId || undefined,
            timeline: oldData.timeline || [],
            lifeActivity: oldData.observations?.lifeActivity || undefined,
            outdoorActivity: oldData.observations?.outdoorActivity || undefined,
            learningActivity: oldData.observations?.learningActivity || undefined,
            gameActivity: oldData.observations?.gameActivity || undefined,
            homeCooperation: oldData.observations?.homeCooperation || undefined
        };
    }

    // 将新API格式转换为旧格式（用于显示）
    static transformToOldFormat(newData) {
        console.log('转换新格式到旧格式:', newData);

        const teacher = this.findTeacherNameById(newData.teacherId);
        const className = this.findClassNameById(newData.classId);
        const school = this.findCampusNameById(newData.campusId);

        console.log('查找结果:', { teacher, className, school });

        const oldFormat = {
            id: newData.id,
            date: newData.date,
            weather: newData.weather,
            teacher: teacher || '未知',
            class: className || '未知',
            school: school || '未知',
            timeline: newData.timeline || [],
            observations: {
                lifeActivity: newData.lifeActivity || '',
                outdoorActivity: newData.outdoorActivity || '',
                learningActivity: newData.learningActivity || '',
                gameActivity: newData.gameActivity || '',
                homeCooperation: newData.homeCooperation || ''
            },
            timestamp: newData.createdAt || newData.created_at || newData.updatedAt
        };

        console.log('转换结果:', oldFormat);
        return oldFormat;
    }
}

// 创建全局API实例
const apiClient = new APIClient();
