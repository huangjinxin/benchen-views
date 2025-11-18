#!/bin/bash

# 北辰幼儿园每日观察系统 - 重启脚本

echo "🔄 正在重启前端服务..."
echo ""

# 停止服务
./stop.sh

echo ""
sleep 1

# 启动服务
./start.sh
