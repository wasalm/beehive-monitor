#!/usr/bin/env node

const https = require('https')
const mqtt = require("mqtt");
const CONFIG = require("./config.js");
const client = mqtt.connect(CONFIG.chirpstack.url);
const fs = require('fs');

logStream = fs.createWriteStream("./data.txt", { flags: 'a' });

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
    console.log(lpp);

    logStream.write(new Date().toISOString());

    logStream.write(", " + lpp["temperature_2"]); // temp
    logStream.write(", " + lpp["analog_output_10"]); // Kast 1
    logStream.write(", " + lpp["analog_output_12"]); // Kast 2
    logStream.write(", " + lpp["analog_output_30"]); // Kast 3
    logStream.write("\n");
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