@echo off
REM CodeGenerator Framework-Dependent Build Script
REM Builds both CLI and GUI as single-file executables (requires .NET runtime)

setlocal enabledelayedexpansion

set CONFIGURATION=Release
set RUNTIME=win-x64
set OUTPUTDIR=..

if not "%1"=="" set CONFIGURATION=%1
if not "%2"=="" set RUNTIME=%2
if not "%3"=="" set OUTPUTDIR=%3

echo CodeGenerator Framework-Dependent Build Script
echo ===============================================
echo Configuration: %CONFIGURATION%
echo Runtime: %RUNTIME%
echo Output Directory: %OUTPUTDIR%
echo Note: These executables require .NET runtime to be installed
echo.

REM Create output directory
if not exist "%OUTPUTDIR%" (
    mkdir "%OUTPUTDIR%"
    echo Created output directory: %OUTPUTDIR%
)

REM Build CLI
echo Building CLI (framework-dependent)...
dotnet publish CodeGenerator.Cli -c %CONFIGURATION% -r %RUNTIME% --self-contained false /p:PublishSingleFile=true /p:DebugType=None /p:DebugSymbols=false -o "%OUTPUTDIR%"

if %ERRORLEVEL% equ 0 (
    echo CLI built successfully
    for %%f in ("%OUTPUTDIR%\code-generator-cli.exe") do (
        if exist "%%f" (
            echo   CLI executable: %%f
            for %%s in ("%%f") do echo   Size: %%~zs bytes
        )
    )
) else (
    echo CLI build failed
    exit /b 1
)

echo.

REM Build GUI
echo Building GUI (framework-dependent)...
dotnet publish CodeGenerator.Gui -c %CONFIGURATION% -r %RUNTIME% --self-contained false /p:PublishSingleFile=true /p:DebugType=None /p:DebugSymbols=false -o "%OUTPUTDIR%"

if %ERRORLEVEL% equ 0 (
    echo GUI built successfully
    for %%f in ("%OUTPUTDIR%\code-generator.exe") do (
        if exist "%%f" (
            echo   GUI executable: %%f
            for %%s in ("%%f") do echo   Size: %%~zs bytes
        )
    )
) else (
    echo GUI build failed
    exit /b 1
)

REM Clean up debug artifacts
echo.
echo Cleaning up debug artifacts...
del /q "%OUTPUTDIR%\*.pdb" 2>nul
del /q "%OUTPUTDIR%\*.dll" 2>nul

echo.
echo Framework-dependent build completed successfully!
echo Output files:
echo   GUI: %OUTPUTDIR%\code-generator.exe
echo   CLI: %OUTPUTDIR%\code-generator-cli.exe
echo.
echo Requirements:
echo   .NET 8.0 Runtime must be installed on target machine
echo.
echo Usage:
echo   GUI: %OUTPUTDIR%\code-generator.exe [dataFile]
echo   CLI: %OUTPUTDIR%\code-generator-cli.exe [dataFile] [outputFolder] [template1] [template2] ... 