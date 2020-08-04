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
            let parameters = hive.join('&');

            httpOptions.path = "/api/sensors?" + parameters;

            const req = https.request(httpOptions, (res) => {
                console.log(`statusCode: ${res.statusCode}`)

                res.on('data', (d) => {
                    process.stdout.write(d)
                })
            })

            req.on('error', (error) => {
                console.error(error)
            })

            req.write("")
            req.end()
        }
    }

    // w weight sum kg

    // uint8_t addAnalogInput(uint8_t channel, float value);
    // uint8_t addAnalogOutput(uint8_t channel, float value);


    // uint8_t addRelativeHumidity(uint8_t channel, float rh);
    // uint8_t addBarometricPressure(uint8_t channel, float hpa);

}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}




















// function handleUnconfirmedDataUp(payload, packet, rssi, snr) {
//     console.log("RSSI: " + rssi + " SNR: " + snr);
//     console.log("Decrypted (ASCII)='" + payload.toString() + "'");
//     console.log("Decrypted (hex)='0x" + payload.toString('hex') + "'");

//     const json = JSON.stringify(decoder.decode(payload));
//     console.log(json);
// }

// function getKeys(devAddr) {
//     //Temporary:
//     if(devAddr == "00011500") {
//         return {
//            NwkSKey: Buffer.from('5D77C37101E7FDAC9C6D43397C164C05', 'hex'),
//            AppSKey: Buffer.from('5C9354F9DACF6E62C051D7560F8E70F4', 'hex')
//         };
//     } else {
//         return null;
//     }
// }