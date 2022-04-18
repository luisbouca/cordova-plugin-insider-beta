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

        return resolve();
    });
};
