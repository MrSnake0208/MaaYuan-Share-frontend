@echo off
setlocal

if "%~1"=="" (
  echo Drag one or more PNG files onto this file.
  pause
  exit /b 1
)

wsl.exe --cd /home/syoius/MaaYuan-Share-frontend node tools/convert-operator-avatars.mjs %*

echo.
pause
