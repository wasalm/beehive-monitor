#!/usr/bin/env node
/*
 * Libraries
 */
const CONSTANTS = require("./constants.js");
const CONFIG = require("./config.js");

const AudioClass = require("./lib/audio.js");
const ArduinoClass = require("./lib/arduino.js");
const Rak811Class = require("./lib/rak811.js");

const Interface = require("./interface.js");

const { encoder } = require('cayenne-lpp'); // See https://www.npmjs.com/package/cayenne-lpp

/*
 * Global variables
 */
let arduino = null;
let rak811 = null;
let devices = [];

let times = {
    screen: -1,
    measurement: -1,
    send: -1,
    reset: -1
};

let currentScreen = 0;
let currentSend = 0;

/*
 * Main program
 */
setup().then(() => {
    setImmediate(main);
});

function main() {
    loop().then(() => {
        setImmediate(main);
    });
}

/*
 * Main functions
 */

async function setup() {
    console.log("Beehive v2.0");

    await setupArduino();
    await setupLora();
    await setupDevices();

    times.screen = process.uptime();
    times.measurement = process.uptime();
    times.send = process.uptime();
    times.reset = process.uptime();
}

async function loop() {
    let now = process.uptime();

    if (now - times.screen > CONFIG.times.screen) {
        await updateScreen();
        times.screen = now;
    }

    if (now - times.measurement > CONFIG.times.measurement) {
        await measure();
        times.measurement = now;
    }

    if (now - times.send > CONFIG.times.send) {
        await send();
        times.send = now;
    }

    if (now - times.reset > CONFIG.times.reset) {
        await reset();
        times.reset = now;
    }
}

/*
 * Setup functions
 */

async function setupArduino() {
    arduino = new ArduinoClass(CONFIG.hardware.arduino.path, { baudRate: CONFIG.hardware.arduino.baudRate });

    await sleep(2000);
    await arduino.reset();
    await arduino.configureSSD1306(0);
    await arduino.writeScreen(0, 2, 2, "Beehive 2.0");
}

async function setupDevices() {
    //Check for existence of BME280 Sensor
    try {
        await arduino.configureBME280(1);

        devices.push({
            type: CONSTANTS.DEVICES.BME280,
            port: CONSTANTS.PATHS.I2C,
            id: 1,
            measurements: []
        });

    } catch (e) {
        console.log("BME280 Not found at I2C");
    }

    // Digital Pins
    // Pins 2 - 4 are used for DS18B20 devices
    for (let id = 2; id <= 4; id++) {
        try {
            await arduino.reset();
            await arduino.configureDS18B20(id, "D" + id);

            devices.push({
                type: CONSTANTS.DEVICES.DS18B20,
                port: "D" + id,
                id: id,
                measurements: []
            });

            console.log("DS18B20 found at D" + id);
        } catch (e) {
            console.log("DS18B20 not found at D" + id);
        }
    }

    // Pins 5 - 6 are used for HX711 device
    try {
        await arduino.reset();
        await arduino.configureHX711(5, "D5");

        devices.push({
            type: CONSTANTS.DEVICES.HX711,
            port: "D5",
            id: 5,
            measurements: []
        });

        console.log("HX711 found at D5");
    } catch (e) {
        console.log("HX711 not found at D5");
    }

    for (let id = 0; id <= 2; id += 2) {
        try {
            await arduino.reset();
            await arduino.configureHX711(id + 10, "A" + id);

            devices.push({
                type: CONSTANTS.DEVICES.HX711,
                port: "A" + id,
                id: id + 10,
                measurements: []
            });

            console.log("HX711 found at A" + id);
        } catch (e) {
            console.log("HX711 not found at A" + id);
        }
    }

    // Add audio device
    devices.push({
        type: CONSTANTS.DEVICES.AUDIO,
        port: CONFIG.hardware.audio.device,
        id: 20,
        object: new AudioClass(CONFIG.hardware.audio.device, CONFIG.hardware.audio.bitRate),
        measurements: []
    });

    //Restart arduino and configure devices
    await arduino.reset();
    await arduino.configureSSD1306(0); // Assume screen is always attached
    await arduino.configureSwitch(16, "A6"); // Assume switch is always attached

    for (let i = 0; i < devices.length; i++) {
        let device = devices[i];
        switch (device.type) {
            case CONSTANTS.DEVICES.BME280:
                await arduino.configureBME280(device.id);
                break;
            case CONSTANTS.DEVICES.HX711:
                await arduino.configureHX711(device.id, device.port);
                break;
            case CONSTANTS.DEVICES.DS18B20:
                await arduino.configureDS18B20(device.id, device.port);
                break;
            default:
            //Ignore
        }
    }

    console.log(devices);
}

async function setupLora() {
    rak811 = new Rak811Class(CONFIG.hardware.rak811.path, { baudRate: CONFIG.hardware.rak811.baudRate });

    await rak811.hardReset(); // Boot RAK811
    let version = await rak811.getVersion();
    await arduino.writeScreen(0, 5, 5, version); // write version to screen

    await rak811.setMode(0);
    await rak811.setConfig(CONFIG.hardware.rak811.config);
    await rak811.setBand("EU868");
    await rak811.joinABP();
}

/*
 * Loops
 */

async function updateScreen() {
    switch (currentScreen) {
        case 0:
            await Interface.displayLoraInfo(arduino, 0, CONFIG.times.send - (process.uptime() - times.send));
            break;
        case 1: // BME280
            await Interface.displayWeatherInfo(arduino, 0, devices);
            break;
        case 2: // HX711
            await Interface.displayWeights(arduino, 0, devices);
            break;
        case 3: // DS18B20
            await Interface.displayTemperatures(arduino, 0, devices);
            break;
        case 4: //Audio;
            await Interface.displayAudioInfo(arduino, 0, devices);
            break;
    }

    if(!(await arduino.getSwitch(16)).value){
        await Interface.displayPause(arduino, 0);
    }

    currentScreen++;
    if (currentScreen > 4) {
        currentScreen = 0;
    }
}

async function measure() {
    if(!(await arduino.getSwitch(16)).value){
        //Paused
        return;
    }

    for (let i = 0; i < devices.length; i++) {
        switch (devices[i].type) {
            case CONSTANTS.DEVICES.BME280:
                devices[i].measurements.push(await arduino.getBME280(devices[i].id));
                break;
            case CONSTANTS.DEVICES.HX711:
                devices[i].measurements.push(await arduino.getHX711(devices[i].id));
                break;
            case CONSTANTS.DEVICES.DS18B20:
                devices[i].measurements.push(await arduino.getDS18B20(devices[i].id));
                break;
            case CONSTANTS.DEVICES.AUDIO:
                devices[i].measurements.push(await devices[i].object.getSample(CONFIG.hardware.audio.duration));
                break;
            default:
            //Ignore
        }

        global.gc();
    }
}

async function send() {
    let result = [];

    let average;
    if (currentSend == 0) {
        for (let i = 0; i < devices.length; i++) {
            switch (devices[i].type) {
                case CONSTANTS.DEVICES.BME280:
                    average = getAverage(devices[i].measurements);
                    if (average !== null) {

                        /* 
                         * BUGFIX: new ENV module gives garbled humidity and/or pressure data. Hence ignore.
                         */
                        //result.push(encoder.encodeRelativeHumidity(devices[i].id, average.humidity));
                        //result.push(encoder.encodeBarometricPressure(devices[i].id, average.pressure / 100)); //Pa -> hPa
                        result.push(encoder.encodeTemperature(devices[i].id, average.temperature));

                        let lastVal = devices[i].measurements.pop();
                        devices[i].measurements = [lastVal];
                    }

                    break;
                // encodeAnalogOutput
                case CONSTANTS.DEVICES.HX711:
                    average = getAverage(devices[i].measurements);
                    if (average !== null) {

                        result.push(encoder.encodeAnalogOutput(devices[i].id, average.weight / 10000));

                        let lastVal = devices[i].measurements.pop();
                        devices[i].measurements = [lastVal];
                    }
                    break;
                case CONSTANTS.DEVICES.DS18B20:
                    average = getAverage(devices[i].measurements);
                    if (average !== null) {

                        result.push(encoder.encodeTemperature(devices[i].id, average.temperature));

                        let lastVal = devices[i].measurements.pop();
                        devices[i].measurements = [lastVal];
                    }
                    break;
                default:
                //Ignore
            }

        }
    } else {
        for (let i = 0; i < devices.length; i++) {
            switch (devices[i].type) {
                case CONSTANTS.DEVICES.AUDIO:
                    average = getAverage(devices[i].measurements);
                    if (average !== null) {
                        average = Object.values(average);
                        for (let j = 0; j < average.length; j++) {
                            result.push(encoder.encodeAnalogInput(devices[i].id + j, average[j]));
                        }

                        let lastVal = devices[i].measurements.pop();
                        devices[i].measurements = [lastVal];
                    }
                    break;
                default:
                //Ignore
            }
        }
    }

    if (result.length != 0) {
        result = Buffer.concat(result);
        //Send data
        console.log("SEND DATA with length " + result.length);
        // console.log(result);
        await rak811.send(result, 1, false);
    }

    //send two different kinds of data
    currentSend = 1 - currentSend;
}

async function reset() {
    // Assume Watchdog will restart
    process.exit(0);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getAverage(data) {
    if (data.length <= 1) {
        return null;
    }

    let result = Object.assign({}, data[0]);
    let keys = Object.keys(result);

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        result[key] = 0;

        for (let j = 0; j < data.length - 1; j++) {
            result[key] += data[j][key];
        }

        result[key] /= (data.length - 1);
    }

    return result;
}

