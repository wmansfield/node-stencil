@echo off
echo CodeGenerator Build Script
echo =========================
echo.

REM Create output directory
if not exist "publish" mkdir publish

echo Building CLI...
dotnet publish CodeGenerator.Cli -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:DebugType=None /p:DebugSymbols=false -o publish
if %ERRORLEVEL% neq 0 (
    echo CLI build failed!
    pause
    exit /b 1
)
echo CLI built successfully!

echo.
echo Building GUI...
dotnet publish CodeGenerator.Gui -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:DebugType=None /p:DebugSymbols=false -o publish
if %ERRORLEVEL% neq 0 (
    echo GUI build failed!
    pause
    exit /b 1
)
echo GUI built successfully!

echo.
echo Cleaning up debug artifacts...
del /q publish\*.pdb 2>nul
del /q publish\*.dll 2>nul

echo.
echo Build completed successfully!
echo Output files:
echo   GUI: publish\code-generator.exe
echo   CLI: publish\code-generator-cli.exe
echo.
echo Usage:
echo   GUI: publish\code-generator.exe [dataFile]
echo   CLI: publish\code-generator-cli.exe [dataFile] [outputFolder] [template1] [template2] ...
echo.