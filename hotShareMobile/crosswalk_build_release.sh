#!/bin/bash
cd .meteor/local/cordova-build/
echo 'Updating cordova-android to the latest'
cordova platform update android
cordova platform remove ios

echo 'Updating Plugins' 
cordova plugin rm com.file-transfer.baidu.bcs
rm -rf  local-plugins/com.file-transfer.baidu.bcs
rm -rf  plugins/com.file-transfer.baidu.bcs
cordova plugin rm cordova-plugin-crosswalk-webview
cordova plugin rm cordova-plugin-whitelist
cordova plugin add https://github.com/solderzzc/cordova-plugin-whitelist.git#r1.1.1
cordova plugin add https://github.com/MobileChromeApps/cordova-plugin-crosswalk-webview.git#1.2.0
cordova plugin add https://github.com/solderzzc/cordova-plugin-file-transfer.git#r0.5.2

echo 'Fixing up the config.xml for whitelist access control'
printf '%s\n' /content/a '  <allow-navigation href="*" subdomain="true" />' . w q | ex -s config.xml 
printf '%s\n' /content/a '  <access origin="*" subdomains="true"/>' . w q | ex -s config.xml 
cp ../../../../cordova-build-overide/platforms/android/assets/www/index.html platforms/android/assets/www/index.html

echo 'Remove android:debuggable to avoid the build error'
sed -i -- 's/android:debuggable=\"false\"//g' platforms/android/AndroidManifest.xml

echo 'Starting build'
cordova compile android --release
cd ../../../

echo 'Signing'
cp .meteor/local/cordova-build/platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk android-armv7-release-unsigned.apk
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore keystore android-armv7-release-unsigned.apk "wifi whiteboard" 
mv android-armv7-release-unsigned.apk android-armv7-release.apk
