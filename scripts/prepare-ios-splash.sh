#!/usr/bin/env bash
set -euo pipefail

SPLASH_SET="ios/App/App/Assets.xcassets/Splash.imageset"
STORYBOARD="ios/App/App/Base.lproj/LaunchScreen.storyboard"

cp public/app-launch.png "$SPLASH_SET/Default@1x~universal~anyany.png"
cp public/app-launch.png "$SPLASH_SET/Default@2x~universal~anyany.png"
cp public/app-launch.png "$SPLASH_SET/Default@3x~universal~anyany.png"

perl -0pi -e 's/contentMode="scaleAspectFill"/contentMode="scaleAspectFit"/g; s/<image name="Splash" width="\d+" height="\d+"\/>/<image name="Splash" width="853" height="1844"\/>/g' "$STORYBOARD"
