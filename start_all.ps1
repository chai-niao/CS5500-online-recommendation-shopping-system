$embedDir = "e:\work\CS5500\final project\backend\ml-services"
$backendDir = "e:\work\CS5500\final project\backend"
$frontendDir = "e:\work\CS5500\final project\frontend"
$venvPython = "e:\work\CS5500\final project\.venv\Scripts\python.exe"
$pythonCmd = if (Test-Path $venvPython) { $venvPython } else { "python" }

Write-Host "Starting ML services..."
Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", "cd '$embedDir'; & '$pythonCmd' -u embedding_service.py")
Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", "cd '$embedDir'; & '$pythonCmd' -u tag_extraction_service.py")
Start-Sleep -Seconds 2

Write-Host "Starting backend..."
Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", "cd '$backendDir'; npm run dev")

Write-Host "Starting frontend..."
Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", "cd '$frontendDir'; npm start")

Write-Host "All services started. Open http://localhost:3000"