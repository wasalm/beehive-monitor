#!/usr/bin/env node
/*
 * Libraries
 */
const https = require('https')
const SerialPort = require('serialport')
const LoraPacket = require('lora-packet');
const { decoder } = require('cayenne-lpp'); // See https://www.npmjs.com/package/cayenne-lpp
const Readline = require('@serialport/parser-readline')

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


function parsePayload(payload, rssi, snr) {
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

    parseMessage(data, packet.getBuffers(), rssi, snr);
}

function parseMessage(data, buffers, rssi, snr) {
    const cayenne = decoder.decode(data);
    console.log("Received message with RSSI:" + rssi + "and SNR: " + snr);
    console.log(cayenne);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}