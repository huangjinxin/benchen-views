#!/bin/bash

# 北辰幼儿园系统 - 诊断脚本

echo "=========================================="
echo "  系统诊断工具"
echo "=========================================="
echo ""

# 检查后端服务器
echo "📡 检查后端服务器..."
if curl -s http://localhost:8891 > /dev/null 2>&1; then
    echo "✅ 后端服务器运行正常"
else
    echo "❌ 后端服务器未响应"
    echo "   请先启动后端服务器"
    exit 1
fi

echo ""

# 测试登录接口
echo "🔐 测试登录接口..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:8891/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@beichen.com","password":"admin123"}')

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

echo "响应状态码: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ 登录成功"
    echo "响应内容:"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo "❌ 登录失败"
    echo "响应内容:"
    echo "$RESPONSE_BODY"
    echo ""
    echo "可能的原因："
    echo "1. 账号密码不正确"
    echo "2. 登录端点不是 /auth/login"
    echo "3. 后端要求不同的数据格式"
    exit 1
fi

echo ""

# 提取token（如果有）
TOKEN=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('access_token') or data.get('accessToken', ''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    echo "✅ Token获取成功"
    echo ""

    # 测试关联数据接口
    echo "📚 测试关联数据接口..."

    echo "  - 测试园区接口 /api/campus"
    CAMPUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:8891/api/campus)
    if [ "$CAMPUS_CODE" = "200" ]; then
        echo "    ✅ 园区接口正常"
    else
        echo "    ❌ 园区接口失败 (状态码: $CAMPUS_CODE)"
    fi

    echo "  - 测试班级接口 /api/classes"
    CLASS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:8891/api/classes)
    if [ "$CLASS_CODE" = "200" ]; then
        echo "    ✅ 班级接口正常"
    else
        echo "    ❌ 班级接口失败 (状态码: $CLASS_CODE)"
    fi

    echo "  - 测试教师接口 /api/users?role=TEACHER&pageSize=1000"
    TEACHER_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "http://localhost:8891/api/users?role=TEACHER&pageSize=1000")
    if [ "$TEACHER_CODE" = "200" ]; then
        echo "    ✅ 教师接口正常"
    else
        echo "    ❌ 教师接口失败 (状态码: $TEACHER_CODE)"
    fi

    echo ""
    echo "  - 测试每日观察记录接口 /api/records/daily-observation"
    RECORD_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:8891/api/records/daily-observation)
    if [ "$RECORD_CODE" = "200" ]; then
        echo "    ✅ 观察记录接口正常"
    else
        echo "    ❌ 观察记录接口失败 (状态码: $RECORD_CODE)"
    fi
else
    echo "⚠️  未能提取Token"
    echo "   响应中可能没有 access_token 或 accessToken 字段"
fi

echo ""
echo "=========================================="
echo "  诊断完成"
echo "=========================================="
echo ""
echo "💡 如果有错误，请："
echo "1. 检查后端API文档: http://localhost:8891/api"
echo "2. 查看后端日志"
echo "3. 确认账号密码是否正确"
echo "4. 确认API端点是否正确"
