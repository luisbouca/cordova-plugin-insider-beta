const fs = require("fs");
const path = require("path");

const pluginId = "cordova-plugin-insider";

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
    console.log("Changing Partner Name!")
    
    const configPath = path.join("plugins/android.json"); 
    const configsString = fs.readFileSync(configPath,"utf-8");
    var configs = JSON.parse(configsString);
    configs = configs.installed_plugins[pluginId];

    var pathGradleDir = path.join(
        context.opts.projectRoot,
        "platforms",
        "android",
        "cordova-plugin-insider"
    );
    
    var pathGradle;
    fs.readdirSync(pathGradleDir).forEach(file => {
        pathGradle = path.join(
            context.opts.projectRoot,
            "platforms",
            "android",
            "cordova-plugin-insider",
            file);
      });

    var pathJava = path.join(
        context.opts.projectRoot,
        "platforms",
        "android",
        "app",
        "src",
        "main",
        "java",
        "insider",
        "cordova",
        "insider",
        "InsiderPlugin.java"
    );

    const partnerName = configs.PARTNER_NAME;

    console.log("Changing Gradle Partner Name!")
    var contentGradle = fs.readFileSync(pathGradle,"utf-8");

    contentGradle = contentGradle.replace(/([\s|\S]*)({partnerName})([\s|\S]*)/,(m,g1,g2,g3)=>{
        return g1+partnerName+g3;
    })

    fs.writeFileSync(pathGradle,contentGradle);

    console.log("Changed Gradle Partner Name!")

    console.log("Changing Java Partner Name!")
    var contentJava = fs.readFileSync(pathJava,"utf-8");

    contentJava = contentJava.replace(/([\s|\S]*)(partnerName = "")([\s|\S]*)/,(m,g1,g2,g3)=>{
        return g1+'partnerName = "'+partnerName+'"'+g3;
    })

    fs.writeFileSync(pathJava,contentJava);

    console.log("Changed Java Partner Name!")

};