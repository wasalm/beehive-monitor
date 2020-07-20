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
let measurements = [];
let deviceObjects = [];

let currentInterface = {
    type: 0,
    device: 0
};

let lastScreenLoop;
let lastMeasureloop;
let lastSendLoop;
let lastResetLoop;

/*
 * Main program
 */
setup().then(() => {
    setImmediate(main);
});


/*
 * Main functions
 */

async function setup() {
    console.log("Beehive v2.0");

    await setupArduino();
    await setupDevices();
    await setupLora();

    lastScreenLoop = process.uptime();
    lastMeasureloop = process.uptime();
    lastSendLoop = process.uptime();
    lastResetLoop = process.uptime();
}

function main() {
    loop().then(() => {
        setImmediate(main);
    });
}

async function loop() {
    let now = process.uptime();
    if (now - lastScreenLoop > CONFIG.times.screen) {
        await updateScreen();
        lastScreenLoop = now;
    }

    if (now - lastMeasureloop > CONFIG.times.measurement) {
        await measure();
        lastMeasureloop = now;
    }

    if (now - lastSendLoop > CONFIG.times.send / Object.keys(CONFIG.nodes).length) {
        await send();
        lastLoraLoop = now;
    }

    if (now - lastResetLoop > CONFIG.times.reset) {
        await reset();
        lastMeasureloop = now;
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

async function setupLora() {
    rak811 = new Rak811Class(CONFIG.hardware.rak811.path, { baudRate: CONFIG.hardware.rak811.baudRate });

    await rak811.hardReset(); // Boot RAK811
    let version = await rak811.getVersion();
    await arduino.writeScreen(0, 5, 5, version); // write version to screen

    await rak811.setMode(0);
    await rak811.setConfig(CONFIG.hardware.rak811.config);
    await rak811.setBand("EU868");
}

async function setupDevices() {

    for (let id = 0; id < CONFIG.devices.length; id++) {
        let device = CONFIG.devices[id];
        measurements[id] = [];

        switch (device.type) {
            case CONSTANTS.DEVICES.BME280:
                await arduino.configureBME280(id + 1);
                break;
            case CONSTANTS.DEVICES.HX711:
                await arduino.configureHX711(id + 1, device.path);
                break;
            case CONSTANTS.DEVICES.DS18B20:
                await arduino.configureDS18B20(id + 1, device.path);
                break;
            case CONSTANTS.DEVICES.AUDIO:
                deviceObjects[id] = new AudioClass(CONFIG.hardware.audio.device, CONFIG.hardware.audio.bitRate);
                break;
        }
    }
}

/*
 * Loops
 */

async function updateScreen() {
    let keys;
    switch (currentInterface.type) {
        case 0:
            await Interface.displayLoraInfo(arduino, 0, (CONFIG.times.send / Object.keys(CONFIG.nodes).length) - (process.uptime() - lastSendLoop));
            break;
        case 1:
            keys = Object.keys(CONFIG.nodes.weather);
            if (currentInterface.device < keys.length) {
                // Screen does exist.
                let key = CONSTANTS.NODES.WEATHER + "." + keys[currentInterface.device];

                for (let id = 0; id < CONFIG.devices.length; id++) {
                    if (CONFIG.devices[id].node == key && CONFIG.devices[id].type == CONSTANTS.DEVICES.BME280) {
                        if (measurements[id].length == 0) {
                            await Interface.displayWeatherInfo(arduino, 0);
                        } else {
                            let measurement = measurements[id][measurements[id].length - 1];
                            await Interface.displayWeatherInfo(arduino, 0, measurement.humidity, measurement.pressure, measurement.temperature);
                            break;
                        }
                    }
                }
            }
            break;
        case 2:
            keys = Object.keys(CONFIG.nodes.general);
            if (currentInterface.device < keys.length) {
                // Screen does exist.
                let key = CONSTANTS.NODES.GENERAL + "." + keys[currentInterface.device];
                let props = [];

                for (let id = 0; id < CONFIG.devices.length; id++) {
                    if (CONFIG.devices[id].node == key) {
                        switch (CONFIG.devices[id].type) {
                            case CONSTANTS.DEVICES.HX711:
                                if(measurements[id].length == 0) {
                                    props.push({
                                        label: "Mass",
                                        value: "-",
                                        unit: "kg"
                                    }); 
                                } else {
                                    let measurement = measurements[id][measurements[id].length -1];
                                    props.push({
                                        label: "Mass",
                                        value: Math.round(measurement.weight*10)/10,
                                        unit: "kg"
                                    }); 
                                }
                                break;
                            case CONSTANTS.DEVICES.DS18B20:
                                if(measurements[id].length == 0) {
                                    props.push({
                                        label: "Temp",
                                        value: "-",
                                        unit: "°C"
                                    }); 
                                } else {
                                    let measurement = measurements[id][measurements[id].length -1];
                                    props.push({
                                        label: "Temp",
                                        value: Math.round(measurement.temperature*10)/10,
                                        unit: "°C"
                                    }); 
                                }
                                break;
                            default:
                                //IGNORE
                        }
                    }
                }

                await Interface.displayHiveInfo(arduino, 0, CONFIG.nodes.general[keys[currentInterface.device]].name, props);
            }
            break;
        case 3:
            console.log("SHOW AUDIO");
            break;
        default:
    }

    //TODO NEXT SCREEN
    switch (currentInterface.type) {
        case 0:
            currentInterface.type = 1;
            currentInterface.device = 0;
            break;
        case 1:
            keys = Object.keys(CONFIG.nodes.weather);
            currentInterface.device++;
            if (currentInterface.device >= Object.keys(CONFIG.nodes.weather).length) {
                currentInterface.type = 2;
                currentInterface.device = 0;
            }
            break;
        case 2:
            keys = Object.keys(CONFIG.nodes.general);
            currentInterface.device++;
            if (currentInterface.device >= Object.keys(CONFIG.nodes.general).length) {
                currentInterface.type = 3;
                currentInterface.device = 0;
            }
            break;
            break;
        case 3:
            //TODO
            currentInterface.type = 0;
            currentInterface.device = 0;
            break;
        default:
    }

    // currentInterface = {
    //     type: 0,
    //     device: 0
    // };
}

async function measure() {
    for (let id = 0; id < CONFIG.devices.length; id++) {
        let device = CONFIG.devices[id];

        switch (device.type) {
            case CONSTANTS.DEVICES.BME280:
                measurements[id].push(await arduino.getBME280(id + 1));
                break;
            case CONSTANTS.DEVICES.HX711:
                measurements[id].push(await arduino.getHX711(id + 1));
                break;
            case CONSTANTS.DEVICES.DS18B20:
                measurements[id].push(await arduino.getDS18B20(id + 1));
                break;
            case CONSTANTS.DEVICES.AUDIO:
                measurements[id].push(await deviceObjects[id].getSample(CONFIG.hardware.audio.duration));
                break;
        }
    }

    global.gc();
    // console.log(measurements);
    console.log("TODO: write data to file");
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

