const { Pool } = require('pg');

// PostgreSQL 连接配置
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'kindergarten',
    user: 'postgres',
    password: 'postgres',
});

async function createTable() {
    try {
        console.log('正在连接数据库...');
        const client = await pool.connect();
        
        console.log('正在创建 daily_observations 表...');
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS daily_observations (
                id SERIAL PRIMARY KEY,
                date VARCHAR(10) NOT NULL,  -- 格式: YYYY-MM-DD
                weather VARCHAR(50),
                "teacherId" VARCHAR(100),
                "classId" VARCHAR(100),
                "campusId" VARCHAR(100),
                timeline JSONB,
                "lifeActivity" TEXT,
                "outdoorActivity" TEXT,
                "learningActivity" TEXT,
                "gameActivity" TEXT,
                "wonderfulMoment" TEXT,
                "homeCooperation" TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `;
        
        await client.query(createTableQuery);
        console.log('✅ daily_observations 表已创建或已存在');
        
        client.release();
    } catch (err) {
        console.error('❌ 创建表失败:', err.message);
    } finally {
        await pool.end();
    }
}

createTable();