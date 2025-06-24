@echo off
chcp 65001 >nul
echo ======================================
echo     🚀 前端性能优化构建脚本
echo ======================================

echo.
echo 📋 开始前端性能优化构建...
echo.

REM 检查Node.js和npm
echo 🔍 检查环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：Node.js 未安装或未添加到PATH
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：npm 未安装或未添加到PATH
    pause
    exit /b 1
)

echo ✅ Node.js 和 npm 环境检查通过

REM 清理旧的构建文件
echo.
echo 🧹 清理旧的构建文件...
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite

REM 安装依赖（如果需要）
echo.
echo 📦 检查并安装依赖...
if not exist node_modules (
    echo 正在安装依赖...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 依赖已存在，跳过安装
)

REM 运行优化构建
echo.
echo 🔧 开始优化构建...
echo 构建配置：
echo   - 启用Terser压缩
echo   - CSS代码分割
echo   - 图片资源优化
echo   - 删除console语句
echo   - 代码分包优化
echo.

npm run build
if errorlevel 1 (
    echo ❌ 构建失败
    pause
    exit /b 1
)

REM 分析构建结果
echo.
echo 📊 分析构建结果...
cd dist

REM 计算总大小
set total_size=0
for /r %%f in (*.*) do (
    set /a total_size+=%%~zf
)

echo.
echo ✅ 构建完成！
echo ======================================
echo     📊 构建结果统计
echo ======================================

REM 显示文件大小
echo.
echo 📁 主要文件大小：
dir /s assets\css\*.css 2>nul | find "文件"
dir /s assets\js\*.js 2>nul | find "文件"
dir /s assets\images\*.* 2>nul | find "文件"

echo.
echo 🎯 优化建议：
echo   ✅ CSS文件应小于100KB
echo   ✅ JS文件应小于200KB
echo   ✅ 图片文件应小于500KB
echo.

REM 检查构建文件大小并给出建议
for %%f in (assets\css\*.css) do (
    set file_size=%%~zf
    if !file_size! gtr 102400 (
        echo ⚠️ 警告：CSS文件 %%f 大于100KB，建议进一步优化
    )
)

for %%f in (assets\js\*.js) do (
    set file_size=%%~zf
    if !file_size! gtr 204800 (
        echo ⚠️ 警告：JS文件 %%f 大于200KB，建议进一步优化
    )
)

echo.
echo 🚀 下一步部署建议：
echo   1. 将 dist 目录内容上传到服务器的 /var/www/frontend
echo   2. 确保Nginx配置已启用gzip压缩
echo   3. 设置合适的缓存策略
echo   4. 测试首页加载速度
echo.

echo 📝 部署命令示例：
echo   scp -r dist/* user@your-server:/var/www/frontend/
echo.

cd ..
echo ✅ 优化构建完成！按任意键继续...
pause >nul 