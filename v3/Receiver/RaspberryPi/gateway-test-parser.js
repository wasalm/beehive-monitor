#!/usr/bin/env node
/*
 * Libraries
 */
const { decoder } = require('cayenne-lpp'); // See https://www.npmjs.com/package/cayenne-lpp

const CONFIG = require("./config.js");

(async () => {
    let data = Buffer.from("0168a3017327830167007702670104036700f60a0324260c0317df", "hex");

    parseMessage(data, null, 0,0);

    // console.log("OLD RESULT:");
    // parseMessageOld(data, null, 0,0);
})();

async function parseMessage(data, buffers, rssi, snr) {
    const cayenne = decoder.decode(data);

    /*
     * Reform data
     */
    let dataObj = {};
    for (let i = 0; i < cayenne.length; i++) {
        Object.assign(dataObj, cayenne[i]);
    }

    /*
     * Add virtual pins
     */
    let virtualPinsKeys= Object.keys(CONFIG.virtualPins);
    for(let i=0; i < virtualPinsKeys.length; i++) {
        let key = virtualPinsKeys[i];
        let scaleKeys = Object.keys(CONFIG.virtualPins[key].scale);
        let hasData = true;

        for(let j=0; j< scaleKeys.length; j++) {
            hasData &= dataObj.hasOwnProperty(scaleKeys[j]);            
        }

        if(hasData) {
            let result = CONFIG.virtualPins[key].offset;
            for(let j=0; j< scaleKeys.length; j++) {
                let value = dataObj[scaleKeys[j]];
                let scale = CONFIG.virtualPins[key].scale[scaleKeys[j]];
                result += value*scale;
            }

            dataObj[key] = result;
            console.log(key + ": " + result);
        }
        
    }

    let hives = Object.assign({}, CONFIG.hives);
    let hivesKeys = Object.keys(hives);
    let dataKeys = Object.keys(dataObj);

    for (let i = 0; i < hivesKeys.length; i++) {
        hives[hivesKeys[i]] = [
            'key=' + encodeURIComponent(CONFIG.hives[hivesKeys[i]]),
            'rssi=' + encodeURIComponent(rssi),
            'snr=' + encodeURIComponent(snr)];
    }

    for (let i = 0; i < dataKeys.length; i++) {
        let quantity = dataKeys[i];
        let value = dataObj[quantity];

        if (quantity in CONFIG.pinMap) {
            let hive = CONFIG.pinMap[quantity];

            if (quantity.startsWith("temperature_")) {
                if (hive == "general") {
                    hives[hive].push("t=" + encodeURIComponent(value));
                } else {
                    hives[hive].push("t_i=" + encodeURIComponent(value));
                }
            }

            if (quantity.startsWith("barometric_pressure_")) {
                hives[hive].push("p=" + encodeURIComponent(value));
            }

            if (quantity.startsWith("relative_humidity_")) {
                hives[hive].push("h=" + encodeURIComponent(value));
            }

            if (quantity.startsWith("analog_output_")) {
                hives[hive].push("w_v=" + encodeURIComponent(value));
            }

            // Audio
            if (quantity == "analog_input_20") {
                hives[hive].push("s_tot=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_21") {
                hives[hive].push("s_bin098_146Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_22") {
                hives[hive].push("s_bin146_195Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_23") {
                hives[hive].push("s_bin195_244Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_24") {
                hives[hive].push("s_bin244_293Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_25") {
                hives[hive].push("s_bin293_342Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_26") {
                hives[hive].push("s_bin342_391Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_27") {
                hives[hive].push("s_bin391_439Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_28") {
                hives[hive].push("s_bin439_488Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_29") {
                hives[hive].push("s_bin488_537Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_30") {
                hives[hive].push("s_bin537_586Hz=" + encodeURIComponent(value));
            }

        }
    }

    for (let i = 0; i < hivesKeys.length; i++) {
        let hive = hives[hivesKeys[i]];
        if (hive.length > 3) {
            console.log(hive);
            // await send(hive);
            // await sleep(5000);
        }
    }
}



async function parseMessageOld(data, buffers, rssi, snr) {
    const cayenne = decoder.decode(data);

    let hives = Object.assign({}, CONFIG.hives);
    let keys = Object.keys(hives);

    for (let i = 0; i < keys.length; i++) {
        hives[keys[i]] = [
            'key=' + encodeURIComponent(CONFIG.hives[keys[i]]),
            'rssi=' + encodeURIComponent(rssi),
            'snr=' + encodeURIComponent(snr)];
    }

    for (let i = 0; i < cayenne.length; i++) {
        let obj = cayenne[i];
        let quantity = Object.keys(obj)[0];
        let value = obj[quantity];

        if (quantity in CONFIG.pinMap) {
            let hive = CONFIG.pinMap[quantity];

            if (quantity.startsWith("temperature_")) {
                if (hive == "general") {
                    hives[hive].push("t=" + encodeURIComponent(value));
                } else {
                    hives[hive].push("t_i=" + encodeURIComponent(value));
                }
            }

            if (quantity.startsWith("barometric_pressure_")) {
                hives[hive].push("p=" + encodeURIComponent(value));
            }

            if (quantity.startsWith("relative_humidity_")) {
                hives[hive].push("h=" + encodeURIComponent(value));
            }

            if (quantity.startsWith("analog_output_")) {
                hives[hive].push("w_v=" + encodeURIComponent(value));
            }

            // Audio
            if (quantity == "analog_input_20") {
                hives[hive].push("s_tot=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_21") {
                hives[hive].push("s_bin098_146Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_22") {
                hives[hive].push("s_bin146_195Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_23") {
                hives[hive].push("s_bin195_244Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_24") {
                hives[hive].push("s_bin244_293Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_25") {
                hives[hive].push("s_bin293_342Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_26") {
                hives[hive].push("s_bin342_391Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_27") {
                hives[hive].push("s_bin391_439Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_28") {
                hives[hive].push("s_bin439_488Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_29") {
                hives[hive].push("s_bin488_537Hz=" + encodeURIComponent(value));
            }

            if (quantity == "analog_input_30") {
                hives[hive].push("s_bin537_586Hz=" + encodeURIComponent(value));
            }

        }
    }

    for (let i = 0; i < keys.length; i++) {
        let hive = hives[keys[i]];
        if (hive.length > 3) {
            console.log(hive);
            // await sleep(5000);
        }
    }
}