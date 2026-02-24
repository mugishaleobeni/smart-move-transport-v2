# Auto-Commit Script for PowerShell
# This script watches for file changes in the src directory and automatically commits them.

$Watcher = New-Object System.IO.FileSystemWatcher
$Watcher.Path = "$PSScriptRoot\..\src"
$Watcher.IncludeSubdirectories = $true
$Watcher.EnableRaisingEvents = $true

$Action = {
    $Path = $Event.SourceEventArgs.FullPath
    $Name = $Event.SourceEventArgs.Name
    $ChangeType = $Event.SourceEventArgs.ChangeType
    Write-Host "Change detected: $Name ($ChangeType)" -ForegroundColor Cyan
    
    # Wait a bit for file lock to release
    Start-Sleep -Milliseconds 500
    
    git add .
    git commit -m "auto: update $Name"
    Write-Host "Changes committed automatically." -ForegroundColor Green
}

Register-ObjectEvent $Watcher "Changed" -Action $Action
Register-ObjectEvent $Watcher "Created" -Action $Action
Register-ObjectEvent $Watcher "Deleted" -Action $Action
Register-ObjectEvent $Watcher "Renamed" -Action $Action

Write-Host "Auto-commit watcher started. Press Ctrl+C to stop." -ForegroundColor Yellow
while ($true) { Start-Sleep 1 }
