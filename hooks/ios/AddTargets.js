//
//  iosAddTarget.js
//  This hook runs for the iOS platform when the plugin or platform is added.
//
// Source: https://github.com/DavidStrausz/cordova-plugin-today-widget
//

//
// The MIT License (MIT)
//
// Copyright (c) 2017 DavidStrausz
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//

const PLUGIN_ID = 'cordova-plugin-insider';
const BUNDLE_SUFFIX = '.insiderextension';
const extensions =[
  {
      "EXTENSION":"NotificationContent",
      "EXTENSION_NAME":"InsiderNotificationContent",
      "PP_Sufix":"insidernotificationcontent",
      "Frameworks":[
        "UserNotifications.framework",
        "UserNotificationsUI.framework",
        "Pods/InsiderMobileAdvancedNotification/InsiderMobileAdvancedNotification.xcframework"
      ],
      "Entitlements":[
        "NotificationContent-Debug",
        "NotificationContent-Release"
      ]

  },
  {
    "EXTENSION":"NotificationService",
    "EXTENSION_NAME":"InsiderNotificationService",
    "PP_Sufix":"insidernotificationservice",
    "Frameworks":[
      "Pods/InsiderMobileAdvancedNotification/InsiderMobileAdvancedNotification.xcframework"
    ],
    "Entitlements":[
      "NotificationService-Debug",
      "NotificationService-Release"
    ]

  }

]

const fs = require('fs');
const path = require('path');
const xcode = require('xcode');
var {getPreferenceValue,getAppId} = require("../utils");
var frameworkFile;

function redError(message) {
    return new Error('"' + PLUGIN_ID + '" \x1b[1m\x1b[31m' + message + '\x1b[0m');
}

function replacePreferencesInFile(filePath, preferences) {
    var content = fs.readFileSync(filePath, 'utf8');
    for (var i = 0; i < preferences.length; i++) {
        var pref = preferences[i];
        var regexp = new RegExp(pref.key, "g");
        content = content.replace(regexp, pref.value);
    }
    fs.writeFileSync(filePath, content);
}

// Determine the full path to the app's xcode project file.
function findXCodeproject(context, callback) {
  var data = fs.readdirSync(iosFolder(context));
  var projectFolder;
  var projectName;
  // Find the project folder by looking for *.xcodeproj
  if (data && data.length) {
    data.forEach(function(folder) {
      if (folder.match(/\.xcodeproj$/)) {
        projectFolder = path.join(iosFolder(context), folder);
        projectName = path.basename(folder, '.xcodeproj');
      }
    });
  }

  if (!projectFolder || !projectName) {
    throw redError('Could not find an .xcodeproj folder in: ' + iosFolder(context));
  }

  callback(projectFolder, projectName);
}

// Determine the full path to the ios platform
function iosFolder(context) {
  return context.opts.cordova.project
    ? context.opts.cordova.project.root
    : path.join(context.opts.projectRoot, 'platforms/ios/');
}

function getPreferenceValues(context,configXml, name) {
  return getPreferenceValue(context,name,configXml);
}

function getCordovaParameter(context,configXml, variableName) {
  var variable;
  var arg = process.argv.filter(function(arg) {
    return arg.indexOf(variableName + '=') == 0;
  });
  if (arg.length >= 1) {
    variable = arg[0].split('=')[1];
  } else {
    variable = getPreferenceValues(context,configXml, variableName);
  }
  return variable;
}

// Get the bundle id from config.xml
// function getBundleId(context, configXml) {
//   var elementTree = require('elementtree');
//   var etree = elementTree.parse(configXml);
//   return etree.getroot().get('id');
// }

function parsePbxProject(context, pbxProjectPath) {

  console.log('    Parsing existing project at location: ' + pbxProjectPath + '...');
  var pbxProject;
  if (context.opts.cordova.project) {
    pbxProject = context.opts.cordova.project.parseProjectFile(context.opts.projectRoot).xcode;
  } else {
    pbxProject = xcode.project(pbxProjectPath);
    pbxProject.parseSync();
  }
  return pbxProject;
}

function forEachExtensionFile(context,extensionName, callback) {
  var extensionFolder = path.join(iosFolder(context), extensionName);
  fs.readdirSync(extensionFolder).forEach(function(name) {
    // Ignore junk files like .DS_Store
    if (!/^\..*/.test(name)) {
      callback({
        name:name,
        path:path.join(extensionFolder, name),
        extension:path.extname(name)
      });
    }
  });
}

function projectPlistPath(context, projectName) {
  return path.join(iosFolder(context), projectName, projectName + '-Info.plist');
}

function projectPlistJson(context, projectName) {
  var plist = require('plist');
  var path = projectPlistPath(context, projectName);
  return plist.parse(fs.readFileSync(path, 'utf8'));
}

function getPreferences(context, configXml, projectName) {
  var plist = projectPlistJson(context, projectName);
  var url_scheme = getAppId(context);
  var group = "group." + url_scheme + BUNDLE_SUFFIX;
  /*if (getCordovaParameter(configXml, 'IOS_GROUP_IDENTIFIER').length >0) {
    group = getCordovaParameter(configXml, 'IOS_GROUP_IDENTIFIER');
  }*/
  return [{
    key: '__DISPLAY_NAME__',
    value: projectName
  }, {
    key: '__BUNDLE_IDENTIFIER__',
    value: plist.CFBundleIdentifier
  } ,{
      key: '__GROUP_IDENTIFIER__',
      value: group
  },{
    key: '__BUNDLE_SHORT_VERSION_STRING__',
    value: plist.CFBundleShortVersionString
  }, {
    key: '__BUNDLE_VERSION__',
    value: plist.CFBundleVersion
  }, {
    key: '__URL_SCHEME__',
    value: url_scheme
  }];
}

// Return the list of files in the extension project, organized by type
function getExtensionFiles(context,extensionName) {
  var files = {source:[],plist:[],resource:[],storyboard:[]};
  var FILE_TYPES = { '.h':'source', '.m':'source', '.plist':'plist','.storyboard':'storyboard' };
  forEachExtensionFile(context,extensionName, function(file) {
    var fileType = FILE_TYPES[file.extension] || 'resource';
    files[fileType].push(file);
  });
  return files;
}

function printExtensionFiles(files) {
  console.log('    Found following files in your '+EXTENSION_NAME+' folder:');
  console.log('    Source files:');
  files.source.forEach(function(file) {
    console.log('     - ', file.name);
  });

  console.log('    Plist files:');
  files.plist.forEach(function(file) {
    console.log('     - ', file.name);
  });

  console.log('    Resource files:');
  files.resource.forEach(function(file) {
    console.log('     - ', file.name);
  });
}

function getResourceRefFromName(myProj, fName) {
  
  const resourceReferences = myProj.hash.project.objects['PBXBuildFile'];
  var resourceRef = '';
  for(var ref in resourceReferences) {
      if(ref.indexOf('_comment') != -1) {
          var tmpResourceRef = resourceReferences[ref];
          if(tmpResourceRef && tmpResourceRef.indexOf(fName) != -1) {
              resourceRef = ref.replace("_comment","");
              break;
          }
      }
  }
  return resourceRef;
}

module.exports = function (context) {
  var deferral;
  var configXml;
  deferral = require('q').defer();
  configXml = fs.readFileSync(
    path.join(context.opts.projectRoot,"plugins", 'fetch.json'),
    'utf-8'
  );

  findXCodeproject(context, function(projectFolder, projectName) {

    console.log('  - Folder containing your iOS project: ' + iosFolder(context));

    var pbxProjectPath = path.join(projectFolder, 'project.pbxproj');
    var pbxProject = parsePbxProject(context, pbxProjectPath);

    var Code_Sign = getCordovaParameter(context,configXml,"CERTIFICATE_TYPE");
    var DEVELOPMENT_TEAM = getCordovaParameter(context,configXml, 'DEVELOPMENT_TEAM');
    var PROVISIONING_PROFILES = JSON.parse(getCordovaParameter(context,configXml, 'PROVISIONING_PROFILES').replace(/'/g, "\""));

    extensions.forEach(extension => {
      var EXTENSION_NAME = extension.EXTENSION_NAME;
      var EXTENSION = extension.EXTENSION;
      var PP_Sufix = extension.PP_Sufix;
      var Frameworks = extension.Frameworks;
      var EntitlementPath = "";
      if(Code_Sign.includes("Development")){
        EntitlementPath = extension.Entitlements[0];
      }else{
        EntitlementPath = extension.Entitlements[1];
      }


      console.log('Adding target "' + PLUGIN_ID + '/'+EXTENSION_NAME+'" to XCode project');
      
      var files = getExtensionFiles(context,EXTENSION);
      // printExtensionFiles(files);

      var preferences = getPreferences(context, configXml, projectName);
      files.plist.concat(files.source).forEach(function(file) {
        replacePreferencesInFile(file.path, preferences);
        // console.log('    Successfully updated ' + file.name);
      });

      // Find if the project already contains the target and group
      var target = pbxProject.pbxTargetByName(EXTENSION_NAME);
      if (target) {
        console.log('    '+EXTENSION_NAME+' target already exists.');
      }

      if (!target) {
        // Add PBXNativeTarget to the project
        target = pbxProject.addTarget(EXTENSION_NAME, 'app_extension', EXTENSION);
        
        // Add a new PBXSourcesBuildPhase for our ViewController
        // (we can't add it to the existing one because an extension is kind of an extra app)
        pbxProject.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);

        // Add a new PBXResourcesBuildPhase for the Resources used by the Extension
        // (MainInterface.storyboard)
        pbxProject.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
      }

      // Create a separate PBXGroup for the extensions files, name has to be unique and path must be in quotation marks
      var pbxGroupKey = pbxProject.findPBXGroupKey({name: EXTENSION});
      if (pbxGroupKey) {
        console.log('    '+EXTENSION+' group already exists.');
      }else {
        pbxGroupKey = pbxProject.pbxCreateGroup(EXTENSION, EXTENSION);

        // Add the PbxGroup to cordovas "CustomTemplate"-group
        var customTemplateKey = pbxProject.findPBXGroupKey({name: 'CustomTemplate'});
        pbxProject.addToPbxGroup(pbxGroupKey, customTemplateKey);
      }

      // Add files which are not part of any build phase (config)
      files.plist.forEach(function (file) {
        pbxProject.addFile(file.name, pbxGroupKey);
      });

      // Add source files to our PbxGroup and our newly created PBXSourcesBuildPhase
      files.source.forEach(function(file) {
        pbxProject.addSourceFile(file.name, {target: target.uuid}, pbxGroupKey);
      });

      //  Add the resource file and include it into the targest PbxResourcesBuildPhase and PbxGroup
      files.resource.forEach(function(file) {
        pbxProject.addResourceFile(file.name, {target: target.uuid}, pbxGroupKey);
      });

      //Add development team and provisioning profile
      var PROVISIONING_PROFILE = "";

      Object.keys(PROVISIONING_PROFILES).forEach(function (key) {
        if(key.includes(PP_Sufix)){
          PROVISIONING_PROFILE = PROVISIONING_PROFILES[key]
        }
      });
      
      var BUNDLE_ID = getAppId(context);
      if(BUNDLE_ID.includes(extensions[0].PP_Sufix)||BUNDLE_ID.includes(extensions[1].PP_Sufix)){
        var bundleIdArray = BUNDLE_ID.split(".")
        bundleIdArray.splice(bundleIdArray.length-1)
        BUNDLE_ID = bundleIdArray.join(".");
      }
      BUNDLE_ID = BUNDLE_ID +"."+PP_Sufix;

      console.log('Adding team', DEVELOPMENT_TEAM, 'and provisoning profile', PROVISIONING_PROFILE, 'and bundleid ', BUNDLE_ID);
      if (PROVISIONING_PROFILE && DEVELOPMENT_TEAM && BUNDLE_ID) {
        var configurations = pbxProject.pbxXCBuildConfigurationSection();
        for (var key in configurations) {
          if (typeof configurations[key].buildSettings !== 'undefined') {
            var buildSettingsObj = configurations[key].buildSettings;
            if (typeof buildSettingsObj['PRODUCT_NAME'] !== 'undefined') {
              var productName = buildSettingsObj['PRODUCT_NAME'];
              if (productName.indexOf(EXTENSION_NAME) >= 0) {
                buildSettingsObj['CODE_SIGN_ENTITLEMENTS'] = '"' + iosFolder(context) + EXTENSION + '/' + EntitlementPath + '.plist"';
                buildSettingsObj['CODE_SIGN_IDENTITY'] = "\""+Code_Sign+"\"";
                buildSettingsObj['PROVISIONING_PROFILE'] = PROVISIONING_PROFILE;
                buildSettingsObj['DEVELOPMENT_TEAM'] = DEVELOPMENT_TEAM;
                buildSettingsObj['PRODUCT_BUNDLE_IDENTIFIER'] = BUNDLE_ID;

                // Add build settings for Swift support, bridging header and xcconfig files
                //         if (addXcconfig) {
                //           configurations[key].baseConfigurationReference =
                //             xcconfigReference + ' /* ' + xcconfigFileName + ' */';
                //           log('Added xcconfig file reference to build settings!', 'info');
                //         }   
                console.log('Added signing identities for extension!');
              }
            }
          }
        }
      }

      // Add a new PBXFrameworksBuildPhase for the Frameworks used by the Extension
      // (NotificationCenter.framework, libCordova.a)

      if(!!Frameworks){
        var frameworksBuildPhase = pbxProject.addBuildPhase(
          [],
          'PBXFrameworksBuildPhase',
          'Frameworks',
          target.uuid
        );
        if (frameworksBuildPhase) {
          console.log('Successfully added PBXFrameworksBuildPhase!');
        }
      }

      Frameworks.forEach(element => {
        var frameworkFile = pbxProject.addFramework(element,{ target: target.uuid });
        if(frameworkFile){
          console.log('Successfully added framework '+element+' needed by the extension!')
        }else{

          var fileRef = getResourceRefFromName(pbxProject, path.basename(element));

          var newFrameworkFileEntry = {
            uuid: fileRef,
            basename: path.basename(element),
            group: "Resources",
            target:target.uuid
          };
          pbxProject.addToPbxFrameworksBuildPhase(newFrameworkFileEntry);
          console.log('Successfully added existing framework '+element+' needed by the extension!')
        }
      });

      console.log('Added '+EXTENSION_NAME+' to XCode project');

    });

    // Write the modified project back to disc
    // console.log('    Writing the modified project back to disk...');
    fs.writeFileSync(pbxProjectPath, pbxProject.writeSync());

    deferral.resolve();
  });

  return deferral.promise;
};
