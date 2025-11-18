# 北辰幼儿园每日观察系统

## 项目概述

北辰幼儿园每日观察系统是一个用于记录和管理幼儿园每日观察记录的 Web 应用程序。该系统允许教师记录每日的观察数据，包括天气、时间线、活动记录等信息。

## 技术栈

- **后端**: Node.js + Express.js
- **数据库**: PostgreSQL
- **前端**: HTML, CSS, JavaScript
- **API**: RESTful API

## 功能特性

- **创建记录**: 添加新的每日观察记录
- **查看记录**: 浏览所有观察记录
- **更新记录**: 修改已有的观察记录
- **删除记录**: 删除不需要的观察记录
- **数据持久化**: 所有数据存储在 PostgreSQL 数据库中

## API 接口

### 创建记录
- **POST** `/api/records`
- 请求体: 
  ```json
  {
    "date": "2025-11-18",
    "weather": "☀️ 晴天",
    "teacherId": "teacher-uuid",
    "classId": "class-uuid",
    "campusId": "campus-uuid",
    "timeline": [
      {
        "time": "08:00",
        "event": "入园晨检"
      }
    ],
    "lifeActivity": "生活活动记录",
    "outdoorActivity": "户外运动情况",
    "learningActivity": "学习活动",
    "gameActivity": "游戏活动",
    "wonderfulMoment": "精彩瞬间",
    "homeCooperation": "家园共育"
  }
  ```
- 响应: `{ success: true, id: 1 }`

### 获取所有记录
- **GET** `/api/records`
- 响应: 数组形式的所有记录

### 获取单个记录
- **GET** `/api/records/:id`
- 响应: 单个记录对象

### 更新记录
- **PUT** `/api/records/:id`
- 请求体: 与创建记录相同
- 响应: `{ success: true, id: "1" }`

### 删除记录
- **DELETE** `/api/records/:id`
- 响应: `{ success: true, id: "1" }`

### 删除所有记录
- **DELETE** `/api/records`
- 响应: `{ success: true, count: 5 }`

## 数据库配置

系统连接到 PostgreSQL 数据库，使用以下配置：
- **主机**: localhost
- **端口**: 5432
- **数据库名**: kindergarten
- **用户名**: postgres
- **密码**: postgres

## 数据模型

每日观察记录包含以下字段：
- `id`: 记录唯一标识符（自增）
- `date`: 日期（格式：YYYY-MM-DD）
- `weather`: 天气情况
- `teacherId`: 教师ID
- `classId`: 班级ID
- `campusId`: 园区ID（可选）
- `timeline`: 时间线（JSONB格式）
- `lifeActivity`: 生活活动（可选）
- `outdoorActivity`: 户外运动（可选）
- `learningActivity`: 学习活动（可选）
- `gameActivity`: 游戏活动（可选）
- `wonderfulMoment`: 精彩瞬间（可选）
- `homeCooperation`: 家园共育（可选）
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 安装和运行

1. 克隆项目：
   ```bash
   git clone https://github.com/huangjinxin/benchen-views.git
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 确保 PostgreSQL 数据库已安装并运行，且已创建 `kindergarten` 数据库

4. 创建所需的数据库表：
   ```bash
   node create-table.js
   ```

5. 启动服务器：
   ```bash
   npm start
   ```

6. 访问系统：http://localhost:8828

## 环境要求

- Node.js (v14.0.0 或更高版本)
- PostgreSQL (v9.5 或更高版本)
- npm (v6.0.0 或更高版本)

## 项目结构

```
beichen-views/
├── index.html          # 主页面
├── records.html        # 记录页面
├── server.js           # 服务器主文件
├── package.json        # 项目依赖和配置
├── README.md           # 项目说明
├── records/            # 旧的文件存储目录（已弃用）
└── node_modules/       # 依赖模块
```

## 数据库集成说明

此项目已成功集成到北辰幼儿园管理系统（NestJS + PostgreSQL）数据库，使用 `daily_observations` 表存储每日观察记录。该表结构与 NestJS 项目的 DailyObservation 模型兼容。

## 本地开发

如需进行本地开发：
1. 确保数据库连接配置正确
2. 修改 server.js 可调整 API 行为
3. 修改 index.html 和 records.html 可调整前端界面

## 许可证

此项目仅供学习和内部使用。

## 支持

如需技术支持或遇到问题，请联系项目维护人员。