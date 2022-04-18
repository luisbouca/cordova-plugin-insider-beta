const fs = require("fs");
const path = require("path");

const pluginId = "com-outsystems-minsdkversionchanger";

module.exports = function(context) {
    function getPlatformVersion(context) {
        var projectRoot = context.opts.projectRoot;
    
        var packageJsonFile = path.join(
            projectRoot,
            "package.json"
        );
    
        var devDependencies = require(packageJsonFile).devDependencies;
    
        if(devDependencies !== undefined){
            //Probably MABS7
            var platform = devDependencies["cordova-android"];
            if (platform.includes('^')){
                var index = platform.indexOf('^');
                platform = platform.slice(0, index) + platform.slice(index+1);
            }
            if (platform.includes('#')){
                var index = platform.indexOf('#');
                platform = platform.slice(index+1);
            }
            if (platform.includes('+')){
                var index = platform.indexOf('+');
                platform = platform.slice(0,index);
            }
            return platform;
        } else {
            //Probably MABS6.X
            var platformsJsonFile = path.join(
                projectRoot,
                "platforms",
                "platforms.json"
            );
            var platforms = require(platformsJsonFile);
            var platform = context.opts.plugin.platform;
            return platforms[platform];
        }    
    }
    console.log("Adding Google Services!")
    
    const androidCordovaVersion = parseInt(getPlatformVersion(context));
    if(androidCordovaVersion >= 10){
        console.log("Detected MABS 8 or above!")

        var pathConfig = path.join(
            context.opts.projectRoot,
            "platforms",
            "android",
            "cdv-gradle-config.json"
        );
        

        var content = fs.readFileSync(pathConfig,"utf-8");

        var contentJSON = JSON.parse(content);
        contentJSON.IS_GRADLE_PLUGIN_GOOGLE_SERVICES_ENABLED = true;
        content = JSON.stringify(contentJSON);

        fs.writeFileSync(pathConfig,content);
        console.log("Added Google Services!")
    }else{
        console.log("Detected MABS 7 or bellow!")

        var pathConfig = path.join(
            context.opts.projectRoot,
            "platforms",
            "android",
            "build.gradle"
        );

        var pathConfig2 = path.join(
            context.opts.projectRoot,
            "platforms",
            "android",
            "app",
            "build.gradle"
        );

        var content = fs.readFileSync(pathConfig,"utf-8");

        content = content.replace(/([\s|\S]*)(dependencies {)([\s|\S]*)/,(m,g1,g2,g3)=>{
            return g1+g2+"\n    classpath 'com.google.gms:google-services:4.2.0'"+g3;
        })

        fs.writeFileSync(pathConfig,content);

        var content2 = fs.readFileSync(pathConfig2,"utf-8");
        content2 = content2 + +"\n apply plugin: 'com.google.gms:google-services'";
        fs.writeFileSync(pathConfig2,content2);

        console.log("Added Google Services!")
    }
};