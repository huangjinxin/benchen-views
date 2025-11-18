#!/bin/bash

# 北辰幼儿园每日观察系统 - 前端启动脚本

echo "=========================================="
echo "  北辰幼儿园每日观察系统 - 前端服务"
echo "=========================================="
echo ""

# 检查后端服务器是否运行
echo "🔍 检查后端服务器状态..."
if curl -s http://localhost:8891 > /dev/null 2>&1; then
    echo "✅ 后端服务器运行正常 (http://localhost:8891)"
else
    echo "⚠️  警告：后端服务器可能未运行"
    echo "   请确保后端服务在 http://localhost:8891 上运行"
    echo ""
fi

# 设置端口
PORT=8828

# 检查端口是否被占用
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 $PORT 已被占用，正在尝试关闭..."
    PID=$(lsof -ti:$PORT)
    kill -9 $PID 2>/dev/null
    sleep 1
fi

echo ""
echo "🚀 启动前端服务..."
echo ""
echo "📋 访问地址："
echo "   - 填写记录: http://localhost:$PORT/index.html"
echo "   - 查看记录: http://localhost:$PORT/records.html"
echo ""
echo "💡 提示："
echo "   - 按 Ctrl+C 停止服务"
echo "   - 浏览器控制台可查看详细日志"
echo ""
echo "=========================================="
echo ""

# 检查Python版本并启动服务器
if command -v python3 &> /dev/null; then
    echo "使用 Python 3 启动服务器..."
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    echo "使用 Python 2 启动服务器..."
    python -m SimpleHTTPServer $PORT
else
    echo "❌ 错误：未找到 Python"
    echo "   请安装 Python 或使用其他 HTTP 服务器"
    exit 1
fi
