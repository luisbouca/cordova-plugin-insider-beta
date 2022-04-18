const fs = require("fs");
const path = require("path");

const pluginId = "cordova-plugin-insider";

module.exports = function(context) {
    console.log("Changing Partner Name!")
    
    const configPath = path.join("plugins/ios.json"); 
    const configsString = fs.readFileSync(configPath,"utf-8");
    var configs = JSON.parse(configsString);
    configs = configs.installed_plugins[pluginId];
    
    const ConfigParser = require('cordova-common').ConfigParser;
    const config = new ConfigParser("config.xml");
    const appName = config.name();

    var pathPlist = path.join(
        context.opts.projectRoot,
        "platforms",
        "ios",
        appName,
        appName+"-Info.plist"
    );

    const partnerName = configs.PARTNER_NAME;

    console.log("Changing Plist Partner Name!")
    var contentPlist = fs.readFileSync(pathPlist,"utf-8");

    contentPlist = contentPlist.replace(/(\$PARTNER_NAME)/,partnerName)

    fs.writeFileSync(pathPlist,contentPlist);

    console.log("Changed Plist Partner Name!")

};