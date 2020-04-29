/**
 * Manager to read config  file
 */

'use strict'

const FILE_NAME = 'appConfig.json';

const CONFIG_DEFAULT = {
    saveDataEverySeconds: 35,
    collectDataEverySeconds: 7,
    apps: {
        distraction: ["youtube", "reddit", "hacker news", "whatsapp", "facebook", "twitter", "steam"],
        productive: ["notion", "gmail", "stack overflow", "github", "visual studio code", "vim", "atom", "xcode", "terminal", "mintty", "toggl"]
    }
};

function getConfig(userDataPath) {
    return CONFIG_DEFAULT;
}

module.exports.getConfig = getConfig;