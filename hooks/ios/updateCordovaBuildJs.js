
const fs = require('fs');
const path = require('path');
var {getCordovaParameter,isCordovaAbove, log} = require('../utils');
var ppString = "";

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(" ","\\s*"); // $& means the whole matched string
}

function replacer (match, p1, p2, p3, offset, string){
    if(p2.includes("PRODUCT_BUNDLE_IDENTIFIER")){
      return [p1,p3].join("");
    }else{
      return [p1,p2,p3].join("");
    }
}

function replacerProjectFile (match, p1, p2, p3, offset, string){
  if(p2.includes("projectName")){
    return [p1,p2,p3].join("");
  }else{
    var projectName = 'var projectName = fs.readdirSync(project_dir).find(d => d.includes(".xcworkspace")).replace(".xcworkspace", "");';
    return [p1,projectName,p2,"&& entry.buildSettings.INFOPLIST_FILE.includes(projectName)",p3].join("");
  }
}


module.exports = function(context) {
    
    log(
    'Running updateCordovaBuildJS hook, adding provisioning profiles to build.js 🦄 ',
    'start'
    );

    var iosFolder = context.opts.cordova.project
    ? context.opts.cordova.project.root
    : path.join(context.opts.projectRoot, 'platforms/ios/');

    var buildJsPath = path.join(
        iosFolder,
        'cordova/lib',
        'build.js'
    )
    const isCordovaAbove8 = isCordovaAbove(context,8);
    var contents;
    if(isCordovaAbove8){
      contents = fs.readFileSync(
        path.join(context.opts.projectRoot,"plugins", 'fetch.json'),
        'utf-8'
      );
    }else{
      contents = fs.readFileSync(
        path.join(context.opts.projectRoot, 'config.xml'),
        'utf-8'
      );
    }
    

    var ppDecoded = getCordovaParameter(context,"PROVISIONING_PROFILES",contents);
    var ppObject = JSON.parse(ppDecoded.replace(/'/g, "\""));
    
    //we iterate here so we can add multiple provisioning profiles to, in the future, add provisioning profiles for other extensions
    Object.keys(ppObject).forEach(function (key) {
        ppString += ", \n \"" + key + "\": \"" + ppObject[key] + "\"";
        log('Trying to add provisioning profile with uuid "' + ppObject[key] + '" to bundleId "' + key + '"','success');
    });
    var plistContents = fs.readFileSync(buildJsPath, 'utf8');
    if(!(plistContents.includes("insidernotificationservice")&&plistContents.includes("insidernotificationcontent"))){
      var toReplace = "[realbundleIdentifier]: String(buildOpts.provisioningProfile)";
      plistContents = plistContents.replace(/\[\s*bundleIdentifier.*provisioningProfile\)/gm, toReplace + ppString);
      var toReplace2 = "if (buildOpts.provisioningProfile && bundleIdentifier)"
      var newCode = "var realbundleIdentifier;\nif(bundleIdentifier.includes(\".insidernotificationcontent\")||bundleIdentifier.includes(\".insidernotificationservice\")){\nvar bundleIdArray = bundleIdentifier.split(\".\")\nbundleIdArray.splice(bundleIdArray.length-1)\nrealbundleIdentifier = bundleIdArray.join(\".\");\n}else{\nrealbundleIdentifier = bundleIdentifier;\n}\n"
      plistContents = plistContents.replace(/if \(buildOpts\.provisioningProfile && bundleIdentifier\)/,newCode+toReplace2)
    }
    fs.writeFileSync(buildJsPath, plistContents);

    var prepareJsPath = path.join(
        iosFolder,
        'cordova/lib',
        'prepare.js'
    )
    var prepareJsContents = fs.readFileSync(prepareJsPath,'utf8');
    var regex = /([\s|\S]*)(if \(origPkg !== pkg\)[\s|\S]*platformConfig\.name\(\)\);\s*\n\s*})([\s|\S]*)/gm

    prepareJsContents = prepareJsContents.replace(regex,replacer);

    fs.writeFileSync(prepareJsPath,prepareJsContents);

    var projectFileJsPath = path.join(
      iosFolder,
      'cordova/lib',
      'projectFile.js'
  )
  var projectFileJsContent = fs.readFileSync(projectFileJsPath,'utf8');
  var regexproj;
  if(isCordovaAbove8){
    regexproj = /([\S|\s]*xcodeproj\.parseSync\(\);)([\S|\s]*entry\.buildSettings\.INFOPLIST_FILE)(\);[\S|\s]*)/gms
  }else{
    regexproj = /([\S|\s]*xcodeproj\.parseSync\(\);)([\S|\s]*entry\.buildSettings\.INFOPLIST_FILE)(;[\S|\s]*)/gms
  }
  
  projectFileJsContent = projectFileJsContent.replace(regexproj,replacerProjectFile);

  fs.writeFileSync(projectFileJsPath,projectFileJsContent);

  log('Successfully edited build.js', 'success');
}
