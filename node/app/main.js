/*
 * Libraries
 */
const CONSTANTS = require("./constants.js");
const CONFIG = require("./config.js");

const AudioClass = require("./lib/audio.js");
const ArduinoClass = require("./lib/arduino.js");
const Rak811Class = require("./lib/rak811.js");

/*
 * Global variables
 */
let arduino = null;
let rak811 = null;
let measurements = null;
let lastMeasurements = null;

let lastScreenLoop = process.uptime();
let lastMeasureloop = process.uptime();
let lastSendLoop = process.uptime();
let lastResetLoop = process.uptime();

/*
 * Main program
 */
setup();
setImmediate(loop);

/*
 * Main functions
 */

function setup() {
    console.log("Beehive v2.0");

    setupArduino();
    setupDevices();
    setupLora();
}

function loop() {
    let now = process.uptime();
    if (now - lastScreenLoop > CONFIG.times.screen) {
        updateScreen();
        lastScreenLoop = now;
    }

    if (now - lastMeasureloop > CONFIG.times.measurement) {
        measure();
        lastMeasureloop = now;
    }

    if (now - lastSendLoop > CONFIG.times.send / Object.keys(CONFIG.nodes).length) {
        send();
        lastLoraLoop = now;
    }

    if (now - lastResetLoop > CONFIG.times.reset) {
        reset();
        lastMeasureloop = now;
    }

    setImmediate(loop);
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

function setupDevices() {
    console.log("TODO: setupDevices");
}

/*
 * Loops
 */

function updateScreen() {
    console.log("TODO: updateScreen");
}

function measure() {
    console.log("TODO: measure");
}

function send() {
    console.log("TODO: send");
}

function reset() {
    // Assume Watchdog will restart
    process.exit(0);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

