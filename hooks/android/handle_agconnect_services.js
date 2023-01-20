var path = require("path");
var fs = require("fs");
var AdmZip = require("adm-zip");

var {getPlatformPath,getPlatformVersion,getWwwPath} = require("../utils");

function getZipFile(resourcesFolder, prefZipFilename) {
    try {
        var dirFiles = fs.readdirSync(resourcesFolder);
        var zipFile;
        dirFiles.forEach(function(file) {
            if (file.match(/\.zip$/)) {
                var filename = path.basename(file, ".zip");
                if (filename === prefZipFilename) {
                    zipFile = path.join(resourcesFolder, file);
                }
            }
        });
        return zipFile;
    } catch (error) {
        return undefined;
    }
}

function unzip(zipFile, unzippedTargetDir, prefZipFilename) {
    var zip = new AdmZip(zipFile);
    var targetDir = path.join(unzippedTargetDir, prefZipFilename);
    zip.extractAllTo(targetDir, true);
    return targetDir;
}

function getServiceFileTargetDir(context) {
    var platformPath = getPlatformPath(context);
    var platform = context.opts.plugin.platform;
    switch (platform) {
        case "android": {
            var platformVersion = getPlatformVersion(context);
            var majorPlatformVersion = platformVersion.split(".")[0];
            if (parseInt(majorPlatformVersion) >= 7) {
                return path.join(platformPath, "app");
            } else {
                return platformPath;
            }
        }
        case "ios":
            return platformPath;
        default:
            return undefined;
    }
}

function copyServiceFile(sourceDir, targetDir, platform) {
    switch (platform) {
        case "android":
            return copyServiceOnAndroid(sourceDir, targetDir);
        case "ios":
            return true;
        default:
            return false;
    }
}

function copyServiceOnAndroid(sourceDir, targetDir) {
    try {
        var sourceFilePath = path.join(sourceDir, "agconnect-services.json");
        var targetFilePath = path.join(targetDir, "agconnect-services.json");
        fs.copyFileSync(sourceFilePath, targetFilePath);
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = function(context) {
    return new Promise(function(resolve, reject) {
        var wwwpath = getWwwPath(context);

        var configPath = path.join(wwwpath, "agconnect-services");

        var prefZipFilename = "agconnect-services";
        var zipFile = getZipFile(configPath, prefZipFilename);

        if (!zipFile) {
            console.log("agconnect-services.zip not found. Skipping Huawei initialization.");
            return resolve();
        }
        var unzipedResourcesDir = unzip(zipFile, configPath, prefZipFilename);
        var platform = context.opts.plugin.platform;
        var targetDir = getServiceFileTargetDir(context);
        copyServiceFile(
            unzipedResourcesDir,
            targetDir,
            platform
        );

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
            if(g3.includes("com.huawei.agconnect:agcp")){
                return g1+g2+g3;
            }else{
                return g1+g2+"\n    classpath 'com.huawei.agconnect:agcp:1.2.1.301'"+g3;
            }
        })

        fs.writeFileSync(pathConfig,content);

        var pathRepo = path.join(
            context.opts.projectRoot,
            "platforms",
            "android",
            "repositories.gradle"
        );
        var content3 = fs.readFileSync(pathRepo,"utf-8");
        content3 = content3.replace(/([\s|\S]*)(repos = {)([\s|\S]*)/,(m,g1,g2,g3)=>{
            if(g3.includes("com.google.gms:google-services")){
                return g1+g2+g3;
            }else{
                return g1+g2+"\n    maven { url \"https://developer.huawei.com/repo/\"}"+g3;
            }
        })

        fs.writeFileSync(pathRepo,content3);

        var content2 = fs.readFileSync(pathConfig2,"utf-8");
        if(!content2.includes("com.huawei.agconnect")){
            content2 = content2 +"\n apply plugin: 'com.huawei.agconnect'";
        }
        fs.writeFileSync(pathConfig2,content2);

        console.log("Added Huawei Services!")

        return resolve();
    });
};
