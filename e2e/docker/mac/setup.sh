#!/bin/bash
set -e

export PATH="$PATH:/usr/local/bin"

if ! hash appium 2>/dev/null; then
  brew install carthage
  brew install ideviceinstaller
  yarn global add appium appium-doctor ios-deploy
  /usr/sbin/DevToolsSecurity -enable
fi

appium-doctor
appium