const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 8828;

// PostgreSQL 连接池配置
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'kindergarten',
    user: 'postgres',
    password: 'postgres',
    max: 20, // 连接池中的最大连接数
    idleTimeoutMillis: 30000, // 多久没有连接则超时
    connectionTimeoutMillis: 2000, // 建立连接的超时时间
});

// 测试数据库连接
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ 数据库连接失败:', err);
    } else {
        console.log('✅ 数据库连接成功');
        release(); // 释放连接回连接池
    }
});

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// 保存记录
app.post('/api/records', async (req, res) => {
    try {
        const data = req.body;
        
        // 将数据映射到 NestJS 的 DailyObservation 模型结构
        const query = `
            INSERT INTO daily_observations (
                date, 
                weather, 
                "teacherId", 
                "classId", 
                "campusId", 
                timeline, 
                "lifeActivity", 
                "outdoorActivity", 
                "learningActivity", 
                "gameActivity", 
                "wonderfulMoment", 
                "homeCooperation",
                created_at,
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
            RETURNING id
        `;
        
        // 将 timeline 数组转换为 JSON 字符串
        const timelineJson = data.timeline ? JSON.stringify(data.timeline) : null;
        
        const values = [
            data.date,
            data.weather || '',
            data.teacherId || data.teacher, // 兼容旧字段名
            data.classId || data.class, // 兼容旧字段名
            data.campusId || null,
            timelineJson,
            data.lifeActivity || null,
            data.outdoorActivity || null,
            data.learningActivity || null,
            data.gameActivity || null,
            data.wonderfulMoment || null,
            data.homeCooperation || null
        ];
        
        const result = await pool.query(query, values);
        const insertedId = result.rows[0].id;
        
        console.log(`✅ 保存成功: ${insertedId}`);
        res.json({ success: true, id: insertedId });
    } catch (error) {
        console.error('❌ 保存失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取所有记录
app.get('/api/records', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                date, 
                weather, 
                "teacherId" as teacherId, 
                "classId" as classId, 
                "campusId" as campusId, 
                timeline, 
                "lifeActivity" as lifeActivity, 
                "outdoorActivity" as outdoorActivity, 
                "learningActivity" as learningActivity, 
                "gameActivity" as gameActivity, 
                "wonderfulMoment" as wonderfulMoment, 
                "homeCooperation" as homeCooperation,
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM daily_observations 
            ORDER BY date DESC
        `;
        
        const result = await pool.query(query);
        const records = result.rows.map(record => {
            // 将 timeline 从 JSON 字符串转换回对象
            if (record.timeline && typeof record.timeline === 'string') {
                try {
                    record.timeline = JSON.parse(record.timeline);
                } catch (e) {
                    console.warn(`⚠️ 解析 timeline 失败:`, e);
                }
            }
            return record;
        });
        
        res.json(records);
    } catch (error) {
        console.error('❌ 读取失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取单个记录
app.get('/api/records/:id', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                date, 
                weather, 
                "teacherId" as teacherId, 
                "classId" as classId, 
                "campusId" as campusId, 
                timeline, 
                "lifeActivity" as lifeActivity, 
                "outdoorActivity" as outdoorActivity, 
                "learningActivity" as learningActivity, 
                "gameActivity" as gameActivity, 
                "wonderfulMoment" as wonderfulMoment, 
                "homeCooperation" as homeCooperation,
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM daily_observations 
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: '记录不存在' });
        }
        
        let record = result.rows[0];
        
        // 将 timeline 从 JSON 字符串转换回对象
        if (record.timeline && typeof record.timeline === 'string') {
            try {
                record.timeline = JSON.parse(record.timeline);
            } catch (e) {
                console.warn(`⚠️ 解析 timeline 失败:`, e);
            }
        }
        
        res.json(record);
    } catch (error) {
        console.error('❌ 读取失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新记录
app.put('/api/records/:id', async (req, res) => {
    try {
        const data = req.body;
        
        const query = `
            UPDATE daily_observations 
            SET 
                date = $2, 
                weather = $3, 
                "teacherId" = $4, 
                "classId" = $5, 
                "campusId" = $6, 
                timeline = $7, 
                "lifeActivity" = $8, 
                "outdoorActivity" = $9, 
                "learningActivity" = $10, 
                "gameActivity" = $11, 
                "wonderfulMoment" = $12, 
                "homeCooperation" = $13,
                updated_at = NOW()
            WHERE id = $1
            RETURNING id
        `;
        
        // 将 timeline 数组转换为 JSON 字符串
        const timelineJson = data.timeline ? JSON.stringify(data.timeline) : null;
        
        const values = [
            req.params.id,
            data.date,
            data.weather || '',
            data.teacherId || data.teacher, // 兼容旧字段名
            data.classId || data.class, // 兼容旧字段名
            data.campusId || null,
            timelineJson,
            data.lifeActivity || null,
            data.outdoorActivity || null,
            data.learningActivity || null,
            data.gameActivity || null,
            data.wonderfulMoment || null,
            data.homeCooperation || null
        ];
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: '记录不存在' });
        }
        
        console.log(`✅ 更新成功: ${req.params.id}`);
        res.json({ success: true, id: req.params.id });
    } catch (error) {
        console.error('❌ 更新失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 删除记录
app.delete('/api/records/:id', async (req, res) => {
    try {
        const query = 'DELETE FROM daily_observations WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: '记录不存在' });
        }
        
        console.log(`🗑️ 删除成功: ${req.params.id}`);
        res.json({ success: true, id: req.params.id });
    } catch (error) {
        console.error('❌ 删除失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 删除所有记录
app.delete('/api/records', async (_req, res) => {
    try {
        const query = 'DELETE FROM daily_observations RETURNING id';
        const result = await pool.query(query);
        
        console.log(`🗑️ 已删除 ${result.rowCount} 条记录`);
        res.json({ success: true, count: result.rowCount });
    } catch (error) {
        console.error('❌ 删除所有记录失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 启动服务器
async function startServer() {
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🌟 北辰幼儿园每日观察系统 启动成功！          ║
║                                                    ║
║   📍 访问地址: http://localhost:${PORT}              ║
║   💾 数据库: PostgreSQL (kindergarten)           ║
║   ⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}   ║
║                                                    ║
╚════════════════════════════════════════════════════╝
        `);
    });
}

startServer();