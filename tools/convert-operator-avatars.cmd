@echo off
setlocal
chcp 65001 >nul

if "%~1"=="" (
  echo Drag one or more PNG files onto this file.
  pause
  exit /b 1
)

where node >nul 2>nul
if not errorlevel 1 (
  pushd "%~dp0.." >nul 2>nul
  if not errorlevel 1 (
    node -e "require('sharp')" >nul 2>nul
    if not errorlevel 1 (
      node "tools\convert-operator-avatars.mjs" %*
      if errorlevel 1 (
        set "EXIT_CODE=1"
      ) else (
        set "EXIT_CODE=0"
      )
      popd
      goto finish
    )
    popd
  )
)

where wsl.exe >nul 2>nul
if not errorlevel 1 (
  wsl.exe --cd "%~dp0.." --exec node tools/convert-operator-avatars.mjs %*
  if errorlevel 1 (
    set "EXIT_CODE=1"
  ) else (
    set "EXIT_CODE=0"
  )
  goto finish
)

echo No usable Node.js environment was found.
echo Install Node.js 18 or later, then run npm install in this repository.
set "EXIT_CODE=1"

:finish
echo.
pause
exit /b %EXIT_CODE%
