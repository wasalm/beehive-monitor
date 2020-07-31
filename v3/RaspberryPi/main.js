/*
 * Libraries
 */
const CONSTANTS = require("./constants.js");
const CONFIG = require("./config.js");

const AudioClass = require("./lib/audio.js");
const ArduinoClass = require("./lib/arduino.js");
const Rak811Class = require("./lib/rak811.js");

const Interface = require("./interface.js");

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

    } catch(e) {
        console.log("BME280 Not found at I2C");
    }

    // Digital Pins
    for(let id = 2; id <= 7; id++) {
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
        } catch(e) {
            console.log("DS18B20 not found at D" + id);
        }

        try {
            await arduino.reset();
            await arduino.configureHX711(id, "D" + id);

            devices.push({
                type: CONSTANTS.DEVICES.HX711,
                port: "D" + id,
                id: id,
                measurements: []
            });

            id ++;

            console.log("HX711 found at D" + id);
        } catch(e) {
            console.log("HX711 not found at D" + id);
        }
    }

    for(let id = 0; id <= 2; id+=2) {
        try {
            await arduino.reset();
            await arduino.configureDS18B20(id + 10, "A" + id);

            devices.push({
                type: CONSTANTS.DEVICES.DS18B20,
                port: "A" + id,
                id: id + 10,
                measurements: []
            });

            console.log("DS18B2 found at A" + id);
        } catch(e) {
            console.log("DS18B20 not found at A" + id);
        }

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
        } catch(e) {
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

    for(let i = 0; i < devices.length; i++) {
        let device = devices[i];
        switch(device.type) {
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

    currentScreen ++;
    if(currentScreen > 4) { 
        currentScreen = 0;
    }
}

async function measure() {
    for(let i=0; i<devices.length; i++) {
        switch(devices[i].type) {
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
    console.log("TODO: send");
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

