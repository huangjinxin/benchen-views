#!/bin/bash

# 北辰幼儿园每日观察系统 - 停止脚本

echo "🛑 正在停止前端服务..."

# 查找并终止使用8828端口的进程
if lsof -Pi :8828 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PID=$(lsof -ti:8828)
    kill -9 $PID 2>/dev/null
    echo "✅ 服务已停止 (PID: $PID)"
else
    echo "ℹ️  没有运行中的服务"
fi
