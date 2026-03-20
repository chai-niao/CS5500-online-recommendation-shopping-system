$ErrorActionPreference = "Stop"

$rootDir = $PSScriptRoot
$mlDir = Join-Path $rootDir "backend\ml-services"
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"
$venvPython = Join-Path $rootDir ".venv\Scripts\python.exe"

$pythonCmd = if (Test-Path $venvPython) { $venvPython } else { "python" }
$embeddingModelDir = Join-Path $rootDir "models\bge-m3"
$qwenModelDir = Join-Path $rootDir "models\Qwen2.5-7B-Instruct"

function Wait-HttpOk {
	param(
		[string]$Url,
		[int]$TimeoutSec = 60,
		[string]$Name = "service"
	)

	$deadline = (Get-Date).AddSeconds($TimeoutSec)
	while ((Get-Date) -lt $deadline) {
		try {
			$resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
			if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
				Write-Host "[OK] $Name -> $Url"
				return $true
			}
		} catch {
			Start-Sleep -Milliseconds 800
		}
	}

	Write-Host "[WARN] $Name not ready in ${TimeoutSec}s -> $Url"
	return $false
}

Write-Host "Starting ML services (embedding + tag extraction)..."
Start-Process -FilePath "powershell" -ArgumentList @(
	"-NoExit",
	"-Command",
	"cd '$mlDir'; `$env:EMBEDDING_MODEL_DIR='$embeddingModelDir'; & '$pythonCmd' -u embedding_service.py"
)

Start-Process -FilePath "powershell" -ArgumentList @(
	"-NoExit",
	"-Command",
	"cd '$mlDir'; `$env:QWEN_MODEL_DIR='$qwenModelDir'; & '$pythonCmd' -u tag_extraction_service.py"
)

Write-Host "Waiting ML services to become healthy..."
Wait-HttpOk -Url "http://127.0.0.1:8001/health" -TimeoutSec 90 -Name "Embedding service (8001)" | Out-Null
Wait-HttpOk -Url "http://127.0.0.1:8002/health" -TimeoutSec 90 -Name "Tag service (8002)" | Out-Null

Write-Host "Starting backend..."
Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", "cd '$backendDir'; npm run dev")
Wait-HttpOk -Url "http://127.0.0.1:5000/api/health" -TimeoutSec 60 -Name "Backend (5000)" | Out-Null

Write-Host "Starting frontend..."
Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", "cd '$frontendDir'; npm start")

Write-Host "All services started. Open http://localhost:3000"