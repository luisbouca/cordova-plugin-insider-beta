const fs = require("fs");
const path = require("path");


const pluginId = "cordova-plugin-insider";

function replaceFile(toreplace,replacewith,filepath){
    var content = fs.readFileSync(filepath,"utf-8");
    var exists = false;
    if(Array.isArray(replacewith)){
        exists = content.includes(replacewith[0]) || content.includes(replacewith[1]);
        if(content.includes(toreplace) && !exists){
            replacewith.forEach(replaceitem => {
                content = content.replace(toreplace,replaceitem);
            });
        
            fs.writeFileSync(filepath,content);
            console.debug("Changed "+path.basename(filepath)+"!");
            return 0;
        }else{
            return -1;
        }
    }else{
        exists = content.includes(replacewith);
        if(content.includes(toreplace) && !exists){
            content = content.replace(toreplace,replacewith);
        
            fs.writeFileSync(filepath,content);
            console.debug("Changed "+path.basename(filepath)+"!");
            return 0;
        }else{
            return -1;
        }
    }
    
}

module.exports = function(context) {
    console.log("Adding Podfile!")

    const configPath = path.join("plugins/ios.json"); 
    const configsString = fs.readFileSync(configPath,"utf-8");
    var configs = JSON.parse(configsString);
    configs = configs.installed_plugins[pluginId];

    const ConfigParser = require('cordova-common').ConfigParser;
    const config = new ConfigParser("config.xml");
    const appName = config.name().replace(" ","-");

    var pathM = path.join(
        context.opts.projectRoot,
        "platforms",
        "ios",
        "Podfile"
    );

    if(fs.existsSync(pathM)){
        var res = replaceFile("end",["\tpod 'InsiderMobile', '~> 12.5.0.0'\nend","\tpod 'InsiderMobileAdvancedNotification', '~> 1.1.1'\nend"],pathM)
        console.log("Replaced PodFile "+res+" !")
    }else{
        const mainPath = path.join(
            context.opts.projectRoot,
            "platforms",
            "ios");
        const mainPluginPodPath = path.join(
            context.opts.projectRoot,
            "platforms",
            "ios");

        const podPath = path.join(
            mainPluginPodPath,
            "Podfile");
        const releasePath = path.join(
            mainPluginPodPath,
            "pods-release.xcconfig")
        const debugPath = path.join(
            mainPluginPodPath,
            "pods-debug.xcconfig")

        replaceFile("HelloCordova",appName,podPath);
        replaceFile("HelloCordova",appName,releasePath);
        replaceFile("HelloCordova",appName,debugPath);
        copyFiles([podPath,releasePath,debugPath],mainPath);
        console.log("Added PodFile!")
    }
};