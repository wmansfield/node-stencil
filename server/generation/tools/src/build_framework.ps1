# CodeGenerator Framework-Dependent Build Script
# Builds both CLI and GUI as single-file executables (requires .NET runtime)

param(
    [string]$Configuration = "Release",
    [string]$Runtime = "win-x64",
    [string]$OutputDir = ".."
)

Write-Host "CodeGenerator Framework-Dependent Build Script" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "Configuration: $Configuration" -ForegroundColor Yellow
Write-Host "Runtime: $Runtime" -ForegroundColor Yellow
Write-Host "Output Directory: $OutputDir" -ForegroundColor Yellow
Write-Host "Note: These executables require .NET runtime to be installed" -ForegroundColor Magenta
Write-Host ""

# Create output directory
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "Created output directory: $OutputDir" -ForegroundColor Cyan
}

# Build CLI
Write-Host "Building CLI (framework-dependent)..." -ForegroundColor Cyan
dotnet publish CodeGenerator.Cli -c $Configuration -r $Runtime --self-contained false /p:PublishSingleFile=true /p:DebugType=None /p:DebugSymbols=false -o $OutputDir

if ($LASTEXITCODE -eq 0) {
    Write-Host "CLI built successfully" -ForegroundColor Green
    $cliExe = Get-ChildItem "$OutputDir\code-generator-cli.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cliExe) {
        Write-Host "  CLI executable: $($cliExe.FullName)" -ForegroundColor Gray
        Write-Host "  Size: $([math]::Round($cliExe.Length / 1KB, 2)) KB" -ForegroundColor Gray
    }
} else {
    Write-Host "CLI build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Build GUI
Write-Host "Building GUI (framework-dependent)..." -ForegroundColor Cyan
dotnet publish CodeGenerator.Gui -c $Configuration -r $Runtime --self-contained false /p:PublishSingleFile=true /p:DebugType=None /p:DebugSymbols=false -o $OutputDir

if ($LASTEXITCODE -eq 0) {
    Write-Host "GUI built successfully" -ForegroundColor Green
    $guiExe = Get-ChildItem "$OutputDir\code-generator.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($guiExe) {
        Write-Host "  GUI executable: $($guiExe.FullName)" -ForegroundColor Gray
        Write-Host "  Size: $([math]::Round($guiExe.Length / 1KB, 2)) KB" -ForegroundColor Gray
    }
} else {
    Write-Host "GUI build failed" -ForegroundColor Red
    exit 1
}

# Clean up debug artifacts
Write-Host ""
Write-Host "Cleaning up debug artifacts..." -ForegroundColor Cyan
Get-ChildItem "$OutputDir\*.pdb" -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem "$OutputDir\*.dll" -ErrorAction SilentlyContinue | Remove-Item -Force

Write-Host ""
Write-Host "Framework-dependent build completed successfully!" -ForegroundColor Green
Write-Host "Output files:" -ForegroundColor Yellow
Write-Host "  GUI: $OutputDir\code-generator.exe" -ForegroundColor Gray
Write-Host "  CLI: $OutputDir\code-generator-cli.exe" -ForegroundColor Gray
Write-Host ""
Write-Host "Requirements:" -ForegroundColor Yellow
Write-Host "  .NET 8.0 Runtime must be installed on target machine" -ForegroundColor Gray
Write-Host ""
Write-Host "Usage:" -ForegroundColor Yellow
Write-Host "  GUI: ..\code-generator.exe [dataFile]" -ForegroundColor Gray
Write-Host "  CLI: ..\code-generator-cli.exe [dataFile] [outputFolder] [template1] [template2] ..." -ForegroundColor Gray 