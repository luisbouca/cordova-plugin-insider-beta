const fs = require("fs");
const path = require("path");

var {getPlatformVersion} = require("../utils");

module.exports = function(context) {
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
        contentJSON.GRADLE_VERSION = "7.1.1";
        contentJSON.AGP_VERSION = "7.0.0";
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
            if(g3.includes("com.google.gms:google-services:4.2.0")){
                return g1+g2+g3;
            }else{
                return g1+g2+"\n    classpath 'com.google.gms:google-services:4.2.0'"+g3;
            }
        })

        fs.writeFileSync(pathConfig,content);

        var content2 = fs.readFileSync(pathConfig2,"utf-8");
        content2 = content2 +"\n apply plugin: 'com.google.gms.google-services'";
        fs.writeFileSync(pathConfig2,content2);

        console.log("Added Google Services!")
    }
};