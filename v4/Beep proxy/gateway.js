#!/usr/bin/env node

const https = require('https')
const mqtt = require("mqtt");
const CONFIG = require("./config.js");
const client = mqtt.connect(CONFIG.chirpstack.url);

client.on("connect", () => {
    client.subscribe("application/+/device/" + CONFIG.chirpstack.deviceEUI + "/event/up", (err) => {
        if (!err) {
            console.log("Connected to Chirpstack.");
        }
    });
});

client.on("message", async (topic, message) => {
    // message is Buffer
    let data = JSON.parse(message.toString());
    await parseMessage(data);
});

async function parseMessage(data) {
    let lpp = parseChirpstackObject(data);
    lpp = addVirtualPins(lpp);

    let post = generatePostBodies(lpp, data)
    for (const [hive, msg] of Object.entries(post)) {
        if (msg.length > 3) {
            console.log(hive);
            console.log(msg);

            // await send(msg);
            // await sleep(5000);
        }
    }
}

function parseChirpstackObject(data) {
    let result = {};

    for (const [type, list] of Object.entries(data.object)) {
        let prefix = "";

        switch (type) {
            case "analogInput":
                prefix = "analog_input_";
                break;
            case "analogOutput":
                prefix = "analog_output_";
                break;
            case "temperatureSensor":
                prefix = "temperature_";
                break;
            case "barometer":
                prefix = "barometric_pressure_";
                break;
            case "humiditySensor":
                prefix = "relative_humidity_";
                break;
            default:
                prefix = "unknown_";
                break;
        }

        for (const [channel, value] of Object.entries(list)) {
            result[prefix + channel] = value;
        }
    }

    return result;
}

function addVirtualPins(lpp) {
    let virtualPinsKeys = Object.keys(CONFIG.virtualPins);
    for (let i = 0; i < virtualPinsKeys.length; i++) {
        let key = virtualPinsKeys[i];
        let scaleKeys = Object.keys(CONFIG.virtualPins[key].scale);
        let hasData = true;


        for (let j = 0; j < scaleKeys.length; j++) {
            hasData &= lpp.hasOwnProperty(scaleKeys[j]);
        }

        if (hasData) {
            let result = CONFIG.virtualPins[key].offset;
            for (let j = 0; j < scaleKeys.length; j++) {
                let value = lpp[scaleKeys[j]];
                let scale = CONFIG.virtualPins[key].scale[scaleKeys[j]];
                result += value * scale;
            }
            lpp[key] = result;
        }
    }
    return lpp;
}

function generatePostBodies(lpp, chirpstack) {
    let hives = Object.assign({}, CONFIG.hives);

    // Make arrays and put general LoRa information in all of them
    let hivesKeys = Object.keys(hives);
    for (let i = 0; i < hivesKeys.length; i++) {
        hives[hivesKeys[i]] = [
            'key=' + encodeURIComponent(CONFIG.hives[hivesKeys[i]]),
            'rssi=' + encodeURIComponent(chirpstack.rxInfo[0].rssi),
            'snr=' + encodeURIComponent(chirpstack.rxInfo[0].snr)
        ];
    }

    for (const [hive, pinmap] of Object.entries(CONFIG.pinMap)) {
        for (let i = 0; i < pinmap.length; i++) {
            let quantity = pinmap[i];

            if (typeof lpp[quantity] != "undefined") {
                let value = lpp[quantity];

                if (quantity == "temperature_1") {
                    hives[hive].push("t=" + encodeURIComponent(value));
                } else {
                    if (quantity.startsWith("temperature_")) {
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
    }

    return hives;
}

const httpOptions = {
    hostname: 'api.beep.nl',
    port: 443,
    method: 'POST',
    path: "/api/sensors",
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}

function send(message) {
    return new Promise((resolve, reject) => {
        let parameters = message.join('&');

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