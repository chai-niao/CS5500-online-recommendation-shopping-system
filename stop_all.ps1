$ErrorActionPreference = "SilentlyContinue"

$ports = @(3000, 5000, 8001, 8002)
$stoppedPids = New-Object System.Collections.Generic.HashSet[int]

function Stop-ByPort {
  param([int]$Port)

  $conns = Get-NetTCPConnection -LocalPort $Port -State Listen
  if (-not $conns) {
    Write-Host "[SKIP] Port $Port not listening"
    return
  }

  foreach ($conn in $conns) {
    $pid = [int]$conn.OwningProcess
    if ($pid -le 0) { continue }

    if ($stoppedPids.Add($pid)) {
      $proc = Get-Process -Id $pid
      if ($proc) {
        Write-Host "[STOP] Port $Port -> PID $pid ($($proc.ProcessName))"
      } else {
        Write-Host "[STOP] Port $Port -> PID $pid"
      }
      Stop-Process -Id $pid -Force
    }
  }
}

Write-Host "Stopping services on ports 3000/5000/8001/8002 ..."
foreach ($p in $ports) {
  Stop-ByPort -Port $p
}

Start-Sleep -Seconds 1

Write-Host "\nVerification:"
foreach ($p in $ports) {
  $conn = Get-NetTCPConnection -LocalPort $p -State Listen
  if ($conn) {
    Write-Host "[WARN] Port $p still listening"
  } else {
    Write-Host "[OK] Port $p stopped"
  }
}

Write-Host "\nDone."
