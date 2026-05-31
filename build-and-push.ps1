param([switch]$NoPause)

$ErrorActionPreference = "Stop"

$registry = if ($env:REGISTRY) { $env:REGISTRY } else { "192.168.1.150:5001/ifraan" }
$version = if ($env:VERSION) { $env:VERSION } else { "latest" }
$workingDirectory = $PSScriptRoot
$logDirectory = Join-Path $workingDirectory "build-logs"

$services = @(
    [PSCustomObject]@{
        Name = "NextJS App"
        Dockerfile = "apps/nextjs-app/Dockerfile"
        Image = "streamystats-nextjs"
    },
    [PSCustomObject]@{
        Name = "Job Server"
        Dockerfile = "apps/job-server/Dockerfile"
        Image = "streamystats-job-server"
    }
)

function Write-Header {
    Clear-Host
    Write-Host "Streamystats v2 Docker Build & Push" -ForegroundColor Blue
    Write-Host "=================================" -ForegroundColor Blue
    Write-Host "Registry: $registry"
    Write-Host "Version: $version"
    Write-Host ""
}

function Write-Menu {
    param([int]$Selected)

    Write-Host "Select which service(s) to build and push:" -ForegroundColor White
    Write-Host ""

    $options = @($services.Name) + "All Services"
    for ($index = 0; $index -lt $options.Count; $index++) {
        if ($index -eq $Selected) {
            Write-Host "  > $($options[$index])" -ForegroundColor Cyan
        } else {
            Write-Host "    $($options[$index])"
        }
    }

    Write-Host ""
    Write-Host "Use Up/Down arrows to navigate, Enter to select, q to quit" -ForegroundColor White
}

function Invoke-BuildAndPush {
    param(
        [PSCustomObject]$Service,
        [string]$Registry,
        [string]$Version
    )

    $logPath = Join-Path $logDirectory "$($Service.Image)-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
    Write-Host "Building $($Service.Name)..." -ForegroundColor Yellow
    Write-Host "Log: $logPath"

    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        $dockerCommand = "docker buildx build --progress plain --platform linux/amd64,linux/arm64 -f `"$($Service.Dockerfile)`" -t `"$Registry/$($Service.Image):$Version`" --push . 2>&1"
        & cmd.exe /d /s /c $dockerCommand | Tee-Object -FilePath $logPath
        $dockerExitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($dockerExitCode -ne 0) {
        throw "Failed to build/push $($Service.Name). See log: $logPath"
    }

    Write-Host "$($Service.Name) built and pushed successfully" -ForegroundColor Green
}

function Invoke-AllBuilds {
    $jobs = foreach ($service in $services) {
        Start-Job -ScriptBlock {
            param($Service, $Registry, $Version, $WorkingDirectory, $LogDirectory)

            Set-Location $WorkingDirectory
            $logPath = Join-Path $LogDirectory "$($Service.Image)-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
            Write-Host "Building $($Service.Name)..." -ForegroundColor Yellow
            Write-Host "Log: $logPath"
            $dockerCommand = "docker buildx build --progress plain --platform linux/amd64,linux/arm64 -f `"$($Service.Dockerfile)`" -t `"$Registry/$($Service.Image):$Version`" --push . 2>&1"
            & cmd.exe /d /s /c $dockerCommand | Tee-Object -FilePath $logPath
            $dockerExitCode = $LASTEXITCODE

            if ($dockerExitCode -ne 0) {
                throw "Failed to build/push $($Service.Name). See log: $logPath"
            }

            Write-Host "$($Service.Name) built and pushed successfully" -ForegroundColor Green
        } -ArgumentList $service, $registry, $version, $workingDirectory, $logDirectory
    }

    Write-Host ""
    Write-Host "Waiting for all builds to complete..." -ForegroundColor Yellow
    Write-Host ""

    $jobs | Wait-Job | Out-Null
    $jobs | Receive-Job
    $failedJobs = @($jobs | Where-Object { $_.State -ne "Completed" })
    $jobs | Remove-Job

    if ($failedJobs.Count -gt 0) {
        throw "One or more builds failed"
    }
}

$selected = 0
$originalCursorVisibility = [Console]::CursorVisible

try {
    New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
    [Console]::CursorVisible = $false

    :buildMenu while ($true) {
        Write-Header
        Write-Menu -Selected $selected

        $key = [Console]::ReadKey($true)
        switch ($key.Key) {
            "UpArrow" {
                $selected = if ($selected -eq 0) { 2 } else { $selected - 1 }
            }
            "DownArrow" {
                $selected = if ($selected -eq 2) { 0 } else { $selected + 1 }
            }
            "Enter" {
                Clear-Host
                [Console]::CursorVisible = $true

                if ($selected -lt $services.Count) {
                    Invoke-BuildAndPush -Service $services[$selected] -Registry $registry -Version $version
                } else {
                    Invoke-AllBuilds
                }

                Write-Host ""
                Write-Host "Build completed!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Built images:"

                $builtServices = if ($selected -lt $services.Count) { @($services[$selected]) } else { $services }
                foreach ($service in $builtServices) {
                    Write-Host "  - $registry/$($service.Image):$version"
                }

                break buildMenu
            }
            "Q" {
                Write-Host ""
                Write-Host "Build cancelled." -ForegroundColor Yellow
                exit 0
            }
        }
    }
} catch {
    Write-Host ""
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Build logs: $logDirectory" -ForegroundColor Yellow
    if (-not $NoPause) {
        Read-Host "Press Enter to close"
    }
    exit 1
} finally {
    [Console]::CursorVisible = $originalCursorVisibility
}
