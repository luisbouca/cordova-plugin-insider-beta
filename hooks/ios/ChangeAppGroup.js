const fs = require("fs");
const path = require("path");

var {getAppId} = require('../utils')

const pluginId = "cordova-plugin-insider";

function replaceFile(toreplace,filepath){
    var content = fs.readFileSync(filepath,"utf-8");
    if(content.includes(toreplace)){
        content = content.replace(/([\s|\S]*)(<string>group\.com\.useinsider\.plugin<\/string>)([\s|\S]*)/,(m,g1,g2,g3)=>{
            return g1+g3;
        })
    }else{
        content = content.replace(/([\s|\S]*)(group\.com\.useinsider\.plugin)([\s|\S]*)/,(m,g1,g2,g3)=>{
            return g1+toreplace+g3;
        })
    }
    
    fs.writeFileSync(filepath,content);
    console.log("Changed "+path.basename(filepath)+"!");
}

module.exports = function(context) {
    console.log("Adding App Group!")

    const configPath = path.join("plugins/ios.json"); 
    const configsString = fs.readFileSync(configPath,"utf-8");
    var configs = JSON.parse(configsString);
    configs = configs.installed_plugins[pluginId];

    const ConfigParser = require('cordova-common').ConfigParser;
    const config = new ConfigParser("config.xml");
    const appName = config.name();

    var appGroup = "group."+getAppId(context)+".insiderextension";

    var pathM = path.join(
        context.opts.projectRoot,
        "platforms",
        "ios",
        appName,
        "Plugins",
        "cordova-plugin-insider",
        "insider",
        "InsiderPlugin.m"
    );

    replaceFile(appGroup,pathM);

    var pathServiceExt = path.join(
        context.opts.projectRoot,
        "platforms",
        "ios",
        "NotificationService",
        "NotificationService.m"
    );

    replaceFile(appGroup,pathServiceExt);

    var pathContentExt = path.join(
        context.opts.projectRoot,
        "platforms",
        "ios",
        "NotificationContent",
        "NotificationViewController.m"
    );

    replaceFile(appGroup,pathContentExt);

    var pathEntitlements = path.join(
        context.opts.projectRoot,
        "platforms",
        "ios",
        appName
    );

    var pathDebug = path.join(pathEntitlements,"Entitlements-Debug.plist");

    replaceFile(appGroup,pathDebug)

    var pathRelease = path.join(pathEntitlements,"Entitlements-Release.plist");
    replaceFile(appGroup,pathRelease);

    var pathContentEntitlements = path.join(
        context.opts.projectRoot,
        "platforms",
        "ios",
        "NotificationContent"
    );

    var pathContentDebug = path.join(pathContentEntitlements,"NotificationContent-Debug.plist");

    replaceFile(appGroup,pathContentDebug)

    var pathContentRelease = path.join(pathContentEntitlements,"NotificationContent-Release.plist");
    replaceFile(appGroup,pathContentRelease);

    var pathServiceEntitlements = path.join(
        context.opts.projectRoot,
        "platforms",
        "ios",
        "NotificationService"
    );

    var pathServiceDebug = path.join(pathServiceEntitlements,"NotificationService-Debug.plist");

    replaceFile(appGroup,pathServiceDebug)

    var pathServiceRelease = path.join(pathServiceEntitlements,"NotificationService-Release.plist");
    replaceFile(appGroup,pathServiceRelease);

    console.log("Added App Group!")
};