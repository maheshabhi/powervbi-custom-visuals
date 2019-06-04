import { Visual } from "../../src/visual";
var powerbiKey = "powerbi";
var powerbi = window[powerbiKey];

var customVisual5A8FA7C3444247698BF6C13AF1E99CDF_DEBUG = {
    name: 'customVisual5A8FA7C3444247698BF6C13AF1E99CDF_DEBUG',
    displayName: 'customVisual',
    class: 'Visual',
    version: '1.0.0',
    apiVersion: '2.6.0',
    create: (options) => {
        if (Visual) {
            return new Visual(options);
        }

        console.error('Visual instance not found');
    },
    custom: true
};

if (typeof powerbi !== "undefined") {
    powerbi.visuals = powerbi.visuals || {};
    powerbi.visuals.plugins = powerbi.visuals.plugins || {};
    powerbi.visuals.plugins["customVisual5A8FA7C3444247698BF6C13AF1E99CDF_DEBUG"] = customVisual5A8FA7C3444247698BF6C13AF1E99CDF_DEBUG;
}

export default customVisual5A8FA7C3444247698BF6C13AF1E99CDF_DEBUG;