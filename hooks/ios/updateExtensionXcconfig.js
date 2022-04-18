
var fs = require('fs');
var path = require('path');
var {getCordovaParameter,isCordovaAbove, log} = require('../utils');
var decode = require('decode-html');
const extensions =[
    {
        "EXTENSION_NAME":"InsiderNotificationContent",
        "PP_Sufix":"insidernotificationcontent"

    },
    {
        "EXTENSION_NAME":"InsiderNotificationService",
        "PP_Sufix":"insidernotificationservice"

    },

]

module.exports = function(context) {
    
    log(
    'Running updateExtensionXcconfig hook, adding sign info to Config.xcconfig 🦄 ',
    'start'
    );


     var iosFolder = context.opts.cordova.project
    ? context.opts.cordova.project.root
    : path.join(context.opts.projectRoot, 'platforms/ios/');
    var contents;
    var cordovaAbove8 = isCordovaAbove(context, 8);
    if (cordovaAbove8) {
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
    var ppArray = JSON.parse(getCordovaParameter(context,"PROVISIONING_PROFILES",contents).replace(/'/g, "\""));
    var Code_Sign = getCordovaParameter(context,"CERTIFICATE_TYPE",contents);
    var devTeam = getCordovaParameter(context,"DEVELOPMENT_TEAM",contents);
    var ppDecoded = decode(getCordovaParameter(context,"PROVISIONING_PROFILES",contents));
    var ppObject = JSON.parse(ppDecoded.replace(/'/g, "\""));
    extensions.forEach(extension => {
        var extensionName = extension.EXTENSION_NAME;
        var xcConfigPath = path.join(iosFolder, extensionName.replace(" ",""), 'Config.xcconfig');
        log(xcConfigPath,"start");
        var PPkey;
        var PPvalue;
        Object.keys(ppObject).forEach(function ([key, value]) {
            if(key.includes(extension.PP_Sufix)){
                PPkey = key;
                PPvalue = value;
            }
        });

        var xcConfigNewContents = 'PRODUCT_BUNDLE_IDENTIFIER=' + PPkey + '\n'
                                + 'PROVISIONING_PROFILE=' + PPvalue + '\n'
                                + 'CODE_SIGN_IDENTITY=' + "\"" + Code_Sign + '"\n'
                                + 'CODE_SIGN_IDENTITY[sdk=iphoneos*]=' + Code_Sign + '\n'
                                + 'DEVELOPMENT_TEAM=' + devTeam + "\n"
                                + 'PRODUCT_DISPLAY_NAME=' + extensionName

        
        fs.appendFileSync(xcConfigPath, xcConfigNewContents);

        log('Successfully edited Config.xcconfig for '+extensionName, 'success');
    });
    
}
