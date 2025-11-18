# 北辰幼儿园每日观察系统 - 新服务器接入说明

## 修改内容概述

已成功将每日观察记录系统连接到新的NestJS后端服务器（http://localhost:8891）。

### 主要变更

1. **新增文件**
   - `api-config.js` - API配置和客户端封装（包含自动认证功能）
   - `SETUP.md` - 本说明文档

2. **修改文件**
   - `index.html` - 修改为使用新API调用
   - `records.html` - 修改为使用新API调用

## 系统架构

### 后端服务器
- **地址**: http://localhost:8891
- **技术栈**: NestJS + PostgreSQL + Prisma + JWT
- **API文档**: http://localhost:8891/api (Swagger)

### 认证机制
- 系统自动在后台获取JWT Token
- 使用配置的账号密码（admin@beichen.com / admin123）自动登录
- Token存储在localStorage中
- Token失效时自动重新获取
- 用户无需手动登录，完全透明

### API端点映射

| 功能 | 旧端点 | 新端点 |
|------|--------|--------|
| 创建记录 | POST /api/records | POST /records/daily-observation |
| 获取记录列表 | GET /api/records | GET /records/daily-observation |
| 获取单条记录 | GET /api/records/:id | GET /records/daily-observation/:id |
| 更新记录 | PUT /api/records/:id | PUT /records/daily-observation/:id |
| 删除记录 | DELETE /api/records/:id | DELETE /records/daily-observation/:id |

## 使用说明

### 1. 启动后端服务器

确保NestJS后端服务正在运行：

```bash
cd backend
npm run start:dev
```

服务器将运行在 http://localhost:8891

### 2. 访问系统

直接打开浏览器访问（无需登录）：
- 填写表单: `index.html`
- 查看记录: `records.html`

### 3. 使用流程

1. 打开`index.html`填写每日观察记录（系统会自动获取访问权限）
2. 填写记录内容
3. 保存记录到服务器
4. 在`records.html`页面可以查询、筛选、删除记录

## 数据模型转换

系统会自动在旧格式和新格式之间转换数据：

### 旧格式（前端显示）
```javascript
{
  date: "2025-11-18",
  weather: "☀️ 晴天",
  teacher: "黄金鑫",        // 字符串
  class: "混龄班",           // 字符串
  school: "北辰核心园",      // 字符串
  timeline: [...],
  observations: {...}
}
```

### 新格式（服务器API）
```javascript
{
  date: "2025-11-18",
  weather: "☀️ 晴天",
  teacherId: "uuid-xxx",      // UUID
  classId: "uuid-yyy",        // UUID
  campusId: "uuid-zzz",       // UUID
  timeline: [...],
  lifeActivity: "...",
  outdoorActivity: "...",
  learningActivity: "...",
  gameActivity: "...",
  wonderfulMoment: "...",
  homeCooperation: "..."
}
```

## 自动认证机制

系统启动时会自动完成以下操作：
1. 检查localStorage中是否有有效的Token
2. 如果没有Token，自动使用配置的账号密码登录
3. 获取JWT Token并保存到localStorage
4. 预加载关联数据（园区、班级、教师列表）
5. 当Token失效时，自动重新获取

**配置的认证凭证** (在api-config.js中)：
- 邮箱: admin@beichen.com
- 密码: admin123

用户完全无需感知这个过程，系统会自动处理所有认证相关的操作。

## 功能特性

### 已实现
- ✅ 后台自动认证（无需用户登录）
- ✅ Token自动管理和自动续期
- ✅ 数据格式自动转换
- ✅ 创建每日观察记录
- ✅ 查询记录列表
- ✅ 查看记录详情
- ✅ 删除单条记录
- ✅ 批量删除记录
- ✅ Token失效自动重新获取
- ✅ 本地缓存备份

### 保留的旧功能
- ✅ 多页表单
- ✅ 进度条显示
- ✅ 自动保存草稿
- ✅ 数据缓存
- ✅ 搜索和筛选
- ✅ 导出JSON
- ✅ 复制和打印

## 技术细节

### API客户端 (api-config.js)

**主要类：**
- `TokenManager`: Token管理
- `APIClient`: API请求封装
- `DataTransformer`: 数据格式转换

**关键方法：**
```javascript
// 自动认证（内部自动调用，无需手动调用）
await apiClient.ensureAuthenticated();

// 创建记录
await apiClient.createDailyObservation(data);

// 获取记录列表
const records = await apiClient.getDailyObservations();

// 删除记录
await apiClient.deleteDailyObservation(id);

// 数据转换
const newFormat = DataTransformer.transformToNewFormat(oldData);
const oldFormat = DataTransformer.transformToOldFormat(newData);
```

## 错误处理

系统包含完整的错误处理机制：

1. **网络错误**: 显示错误通知
2. **401未授权**: 自动重新获取Token并重试请求
3. **服务器错误**: 显示错误信息
4. **数据转换失败**: 提示用户检查数据
5. **自动登录失败**: 显示错误并提示检查后端服务

## 注意事项

### 必须先启动后端服务器
在使用前端系统前，确保后端服务器已启动且运行在 http://localhost:8891

### 数据依赖
- 系统依赖后端的园区、班级、教师数据
- 如果这些数据不存在，可能导致保存失败
- 需要在后端先创建这些基础数据

### CORS配置
如果遇到跨域问题，确保后端服务器已正确配置CORS：
```javascript
// backend/src/main.ts
app.enableCors();
```

### 端口配置
如果后端端口不是8891，需要修改 `api-config.js` 中的 `baseURL`：
```javascript
const API_CONFIG = {
    baseURL: 'http://localhost:YOUR_PORT'
};
```

## 故障排查

### 问题：系统无法访问
- 检查后端服务器是否运行在 http://localhost:8891
- 查看浏览器控制台是否有"自动获取访问令牌"的日志
- 检查api-config.js中配置的账号密码是否正确
- 确认后端账号admin@beichen.com存在且密码为admin123

### 问题：保存失败
- 检查是否填写了必填字段（日期、天气、老师姓名、班级）
- 确认后端数据库中存在对应的教师、班级、园区数据
- 查看浏览器控制台错误信息
- 检查Network标签中API请求的响应

### 问题：记录列表为空
- 确认后端有数据
- 检查API响应是否正常
- 查看浏览器Network标签

## 开发者信息

### 文件结构
```
beichen-views/
├── api-config.js        # API配置和客户端（包含自动认证）
├── index.html           # 表单填写页面（已修改）
├── records.html         # 记录查询页面（已修改）
├── server.js            # 旧的本地服务器（不再使用）
└── SETUP.md            # 本说明文档
```

### 调试技巧
1. 打开浏览器开发者工具
2. 查看Console标签的日志
3. 查看Network标签的API请求
4. 检查Application -> Local Storage中的Token

## 更新日志

### 2025-11-18 v2
- ✅ 修改为自动认证模式（无需用户登录）
- ✅ 移除登录页面
- ✅ 实现Token自动获取和续期
- ✅ 优化用户体验，完全透明的认证过程

### 2025-11-18 v1
- ✅ 创建API配置文件
- ✅ 修改index.html支持新API
- ✅ 修改records.html支持新API
- ✅ 实现数据格式自动转换
- ✅ 添加完整的错误处理

## 支持

如有问题，请检查：
1. 后端API文档: http://localhost:8891/api
2. 浏览器控制台错误信息
3. 后端服务器日志
