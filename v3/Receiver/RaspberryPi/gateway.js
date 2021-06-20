#!/usr/bin/env node
/*
 * Libraries
 */
const https = require('https')
const SerialPort = require('serialport')
const LoraPacket = require('lora-packet');
const { decoder } = require('cayenne-lpp'); // See https://www.npmjs.com/package/cayenne-lpp
const Readline = require('@serialport/parser-readline')
const fs = require('fs');

const ESP8266Class = require("./esp8266.js");
const CONFIG = require("./config.js");

const httpOptions = {
    hostname: 'api.beep.nl',
    port: 443,
    method: 'POST',
    path: "/api/sensors",
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}

let serial;

let logStream = null;
if (CONFIG.log.enabled) {
    logStream = fs.createWriteStream(CONFIG.log.path, { flags: 'a' });
}

(async () => {
    /*
     * Init Serial
     */

    serial = new ESP8266Class(CONFIG.serial.path, { baudRate: CONFIG.serial.baudRate });
    // serial.debugSerial();

    await serial.softReset();
    await serial.setFrequency(CONFIG.lora.frequency);
    await serial.setSpreadingFactor(CONFIG.lora.spreadingFactor);
    await serial.setSyncWord(CONFIG.lora.syncWord);
    await serial.receive(parsePayload);
})()


async function parsePayload(payload, rssi, snr) {
    let packet = LoraPacket.fromWire(payload);

    if (packet.getMType() != "Unconfirmed Data Up") {
        // Ignore other types of messages
        return;
    }

    let devAddr = packet.getBuffers().DevAddr.toString('hex');

    if (devAddr != CONFIG.lora.devAddr) {
        // Ignore other devices
        return;
    }

    let NwkSKey = Buffer.from(CONFIG.lora.NwkSKey, 'hex');
    let AppSKey = Buffer.from(CONFIG.lora.AppSKey, 'hex');

    if (!LoraPacket.verifyMIC(packet, NwkSKey)) {
        // Ignore invalid key
        return;
    }

    let data = LoraPacket.decrypt(packet, AppSKey, NwkSKey);

    await parseMessage(data, packet.getBuffers(), rssi, snr);
}

async function parseMessage(data, buffers, rssi, snr) {
    const cayenne = decoder.decode(data);

    if (CONFIG.log.enabled) {
        logStream.write(new Date().toISOString());
        logStream.write("|");
        logStream.write(rssi.toString());
        logStream.write("|");
        logStream.write(snr.toString());
        logStream.write("|");
        logStream.write(data.toString('hex'));
        logStream.write("\n");
    }

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

                // console.log("result: " + result);
                result += value*scale;

                // console.log("Key: " + scaleKeys[j]);
                // console.log("Value: " + value);
                // console.log("Scale: " + scale);
                // console.log("Value x scale: " + (value*scale));
                // console.log();
            }

            dataObj[key] = result;
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
                hives[hive].push("weight_kg=" + encodeURIComponent(value));
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
            await send(hive);
            await sleep(5000);
        }
    }
}

function send(hive) {
    return new Promise((resolve, reject) => {
        let parameters = hive.join('&');

        httpOptions.path = "/api/sensors?" + parameters;

        const req = https.request(httpOptions, (res) => {
            //console.log(`statusCode: ${res.statusCode}`)

            res.on('data', (d) => {
                //process.stdout.write(d)
            })

            res.on('end', (error) => {
                resolve();
            })
        })

        req.on('error', (error) => {
            reject(error);
        })

        req.write("")
        req.end()
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}