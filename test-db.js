const { Pool } = require('pg');

// PostgreSQL 连接配置
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'kindergarten',
    user: 'postgres',
    password: 'postgres',
});

async function testConnection() {
    try {
        console.log('正在测试数据库连接...');
        const client = await pool.connect();
        console.log('✅ 数据库连接成功！');
        
        // 测试查询
        const result = await client.query('SELECT NOW()');
        console.log('数据库时间:', result.rows[0].now);
        
        // 检查 daily_observations 表是否存在
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'daily_observations'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('✅ daily_observations 表存在');
        } else {
            console.log('❌ daily_observations 表不存在');
        }
        
        client.release();
    } catch (err) {
        console.error('❌ 数据库连接失败:', err.message);
    } finally {
        await pool.end();
    }
}

testConnection();