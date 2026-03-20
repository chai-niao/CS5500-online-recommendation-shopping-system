# Demo Startup Script for School Network Presentation
# 学校网络演示启动脚本

# Step 1: 获取本地IP (支持中文/英文 Windows)
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎓 CS5500 AI Hypermarket - School Network Demo" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 方法1：从.NET获取（最可靠）
$local_ip = $null
try {
    $hostname = [System.Net.Dns]::GetHostName()
    $addresses = [System.Net.Dns]::GetHostAddresses($hostname)
    $local_ip = $addresses | Where-Object { $_.AddressFamily -eq "InterNetwork" -and $_.ToString() -notmatch "^127\." } | Select-Object -First 1 | ForEach-Object { $_.ToString() }
} catch {
    Write-Host "ℹ️  Method 1 failed, trying ipconfig..." -ForegroundColor Gray
}

# 方法2：从 ipconfig 获取（备用）
if (-not $local_ip) {
    $ipconfig_output = ipconfig
    # 支持中文 "IPv4 地址" 和英文 "IPv4 Address"
    $ipv4_line = $ipconfig_output | Select-String -Pattern "IPv4|地址" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($ipv4_line) {
        $local_ip = [regex]::Matches($ipv4_line, '\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}') | Select-Object -First 1 | ForEach-Object { $_.Value }
    }
}

# 方法3：用户输入（最后手段）
if (-not $local_ip) {
    Write-Host "⚠️  Could not auto-detect local IP. Please check:" -ForegroundColor Yellow
    Write-Host "   1. Run 'ipconfig' in CMD" -ForegroundColor White
    Write-Host "   2. Look for 'IPv4 Address' or 'IPv4 地址'" -ForegroundColor White
    Write-Host "   3. Use the value from your network adapter (not 127.0.0.1)" -ForegroundColor White
    Write-Host ""
    $local_ip = Read-Host "Enter your local IP (e.g., 192.168.1.100)"
}

Write-Host "✅ Using local network IP: $local_ip" -ForegroundColor Yellow
Write-Host ""
Write-Host "📱 Access URLs for other devices:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://$local_ip`:3000" -ForegroundColor Green
Write-Host "   Backend:   http://$local_ip`:5000/api/health" -ForegroundColor Green
Write-Host ""

Write-Host "⏳ Starting services..." -ForegroundColor Cyan
Write-Host ""

# Step 2: Start backend (in new window) - 必须先启动
Write-Host "📦 Starting Backend (Port 5000)..." -ForegroundColor Magenta
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$pwd\backend'; npm start" -PassThru
Start-Sleep -Seconds 5

# 等待后端启动就绪 - 使用curl/curl.exe检查
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Cyan
$maxWait = 30
$waited = 0
$backendReady = $false

while ($waited -lt $maxWait) {
    try {
        # 使用curl检查（Windows 10/11内置）
        $result = curl.exe -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/health" 2>$null
        if ($result -eq "200") {
            Write-Host ""
            Write-Host "✅ Backend is ready!" -ForegroundColor Green
            $backendReady = $true
            break
        }
    } catch { }
    
    $waited += 1
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 1
}

if (-not $backendReady) {
    Write-Host ""
    Write-Host "⚠️  Backend health check timeout, but continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

# Step 3: Start frontend (in new window)
Write-Host "🎨 Starting Frontend (Port 3000)..." -ForegroundColor Magenta
Write-Host "   (会在浏览器中自动打开)" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$pwd\frontend'; `$env:HOST='0.0.0.0'; `$env:REACT_APP_API_URL='http://$local_ip`:5000/api'; npm start"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✨ Services starting! Please wait 30-60 seconds." -ForegroundColor Green
Write-Host ""
Write-Host "📍 On this computer:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "📍 On other devices (same WiFi):" -ForegroundColor Yellow
Write-Host "   http://$local_ip`:3000" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 API Health Check:" -ForegroundColor Yellow
Write-Host "   http://$local_ip`:5000/api/health" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Important:" -ForegroundColor Cyan
Write-Host "   ✓ Backend window starts first" -ForegroundColor White
Write-Host "   ✓ Frontend window starts after backend is ready" -ForegroundColor White
Write-Host "   ✓ If frontend shows Proxy errors, wait 10 more seconds" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
