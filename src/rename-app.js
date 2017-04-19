#!/usr/bin/env node

var fs = require('fs');
var path = require("path");
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var builder = new xml2js.Builder({
    xmldec: {
        version: '1.0',
        encoding: 'UTF-8'
    }
});

module.exports = function (context) {

    console.log('Attempting to set app name');

    var projectRoot = context.opts.projectRoot;
    var configPath = path.join(projectRoot, 'platforms', 'android', 'res', 'xml', 'config.xml');
    var stringsPath = path.join(projectRoot, 'platforms', 'android', 'res', 'values', 'strings.xml');
    var stringsXml, name;

    // make sure the android config file exists
    try {
        fs.accessSync(configPath, fs.F_OK);
    } catch(e) {
        return;
    }

    name = getConfigParser(context, configPath).getPreference('AppName');

    if (name) {
        stringsXml = fs.readFileSync(stringsPath, 'UTF-8');
        parser.parseString(stringsXml, function (err, data) {

            data.resources.string.forEach(function (string) {
                // retrieve the resource with APP_NAME and Add a new line character for Android Launch name as oppose to space for iOS
                if (string.$.name === 'app_name') {

                    console.log('Setting App Name: ', name.split(' ').join('\\n'));
                    string._ = name.split(' ').join('\\n');
                }
            });

            console.log('setting data to' + data);

            fs.writeFile(stringsPath, builder.buildObject(data));

        });
    }
};

function getConfigParser(context, config) {
    var semver = context.requireCordovaModule('semver');

    if (semver.lt(context.opts.cordova.version, '5.4.0')) {
        ConfigParser = context.requireCordovaModule('cordova-lib/src/ConfigParser/ConfigParser');
    } else {
        ConfigParser = context.requireCordovaModule('cordova-common/src/ConfigParser/ConfigParser');
    }

    return new ConfigParser(config);
}
