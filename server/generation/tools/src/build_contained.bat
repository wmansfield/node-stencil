@echo off
echo CodeGenerator Build Script
echo =========================
echo.

echo Building CLI...
dotnet publish CodeGenerator.Cli -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:DebugType=None /p:DebugSymbols=false -o ..
if %ERRORLEVEL% neq 0 (
    echo CLI build failed!
    pause
    exit /b 1
)
echo CLI built successfully!

echo.
echo Building GUI...
dotnet publish CodeGenerator.Gui -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:DebugType=None /p:DebugSymbols=false -o ..
if %ERRORLEVEL% neq 0 (
    echo GUI build failed!
    pause
    exit /b 1
)
echo GUI built successfully!

echo.
echo Cleaning up debug artifacts...
del /q ..\*.pdb 2>nul
del /q ..\*.dll 2>nul

echo.
echo Build completed successfully!
echo Output files:
echo   GUI: ..\code-generator.exe
echo   CLI: ..\code-generator-cli.exe
echo.
echo Usage:
echo   GUI: ..\code-generator.exe [dataFile]
echo   CLI: ..\code-generator-cli.exe [dataFile] [outputFolder] [template1] [template2] ...
echo.