@echo off
echo 🚀 启动VideoPro前端服务...
echo.

REM 检查是否安装了Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到Node.js，请先安装Node.js
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

REM 检查是否存在node_modules
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

REM 启动开发服务器
echo 🎯 启动前端开发服务器...
echo 🌐 前端地址: http://localhost:5173
echo 📱 后端地址: http://localhost:3001
echo.
npm run dev 