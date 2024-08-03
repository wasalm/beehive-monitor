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

const {
	encoder
} = require('cayenne-lpp');

/*
	* Global variables
	*/
let arduinos = [];
let rak811 = null;
let devices = [];

let times = {
	screen: -1,
	measurement: -1,
	send: -1,
	reset: -1
};

let currentScreen = 0;
let currentArduinoOnScreen = 0;
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
	console.log("Beehive v3.0");

	await setupArduino();
	await setupLora();

	await arduinos[0].writeScreen(0, 0, 4, " Scan  sensors ");
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
	arduinos = [];
	let list = {};

	for (let i = 0; i < CONFIG.hardware.arduino.devices.length; i++) {
		let device = new ArduinoClass({
			path: CONFIG.hardware.arduino.devices[i],
			baudRate: CONFIG.hardware.arduino.baudRate
		});

		await sleep(1000);
		await device.reset();
		let id = await device.getSerialId();

		list[id] = device;
	}

	for (let i = 0; i < CONFIG.hardware.arduino.ids.length; i++) {
		let id = CONFIG.hardware.arduino.ids[i];
		if (typeof list[id] == "undefined") {
			console.log("Arduino not found: resetting.")
			reset();
		}
		arduinos[i] = list[id];
	}

	await arduinos[0].configureSSD1306(0);
	await arduinos[0].writeScreen(0, 2, 2, "Beehive 3.0");
	await arduinos[0].writeScreen(0, 2, 4, "  Booting  ");
}

async function setupLora() {
	rak811 = new Rak811Class({
		path: CONFIG.hardware.rak811.path,
		baudRate: CONFIG.hardware.rak811.baudRate
	});

	await rak811.hardReset();
	await rak811.setMode(0);
	await rak811.setConfig(CONFIG.hardware.rak811.config);
	await rak811.setBand("EU868");
	await rak811.joinABP();
}


async function setupDevices() {
	for (let i = 0; i < arduinos.length; i++) {
		//Check for existence of BME280 Sensor
		try {
			await arduinos[i].reset();
			await arduinos[i].configureBME280(1);

			devices.push({
				type: CONSTANTS.DEVICES.BME280,
				port: CONSTANTS.PATHS.I2C,
				id: 1,
				arduino: i,
				caynenneId: 1 + 20 * i,
				measurements: []
			});

		} catch (e) {}

		try {
			await arduinos[i].reset();
			await arduinos[i].configureQMP6988(1);

			devices.push({
				type: CONSTANTS.DEVICES.QMP6988,
				port: CONSTANTS.PATHS.I2C,
				id: 1,
				arduino: i,
				caynenneId: 1 + 20 * i,
				measurements: []
			});

		} catch (e) {}

		// Digital Pins
		// Pins 2 - 4 are used for DS18B20 devices
		for (let id = 2; id <= 4; id++) {
			try {
				await arduinos[i].reset();
				await arduinos[i].configureDS18B20(id, "D" + id);

				devices.push({
					type: CONSTANTS.DEVICES.DS18B20,
					port: "D" + id,
					id: id,
					arduino: i,
					caynenneId: id + 20 * i,
					measurements: []
				});
			} catch (e) {}
		}

		// Pins 5 - 6 are used for HX711 device
		try {
			await arduinos[i].reset();
			await arduinos[i].configureHX711(5, "D5");

			devices.push({
				type: CONSTANTS.DEVICES.HX711,
				port: "D5",
				id: 5,
				arduino: i,
				caynenneId: 5 + 20 * i,
				measurements: []
			});
		} catch (e) {}

		for (let id = 0; id <= 2; id += 2) {
			try {
				await arduinos[i].reset();
				await arduinos[i].configureHX711(id + 10, "A" + id);

				devices.push({
					type: CONSTANTS.DEVICES.HX711,
					port: "A" + id,
					id: id + 10,
					arduino: i,
					caynenneId: id + 10 + 20 * i,
					measurements: []
				});
			} catch (e) {}
		}
	}

	// Add audio device
	devices.push({
		type: CONSTANTS.DEVICES.AUDIO,
		port: CONFIG.hardware.audio.device,
		id: 100,
		caynenneId: 100,
		object: new AudioClass(CONFIG.hardware.audio.device, CONFIG.hardware.audio.bitRate),
		measurements: []
	});

	//Restart arduino and configure devices
	for (let i = 0; i < arduinos.length; i++) {
		await arduinos[i].reset();
	}

	await arduinos[0].configureSSD1306(0); // Assume screen is always attached to first device
	await arduinos[0].configureSwitch(16, "A6"); // Assume switch is always attached to first device

	for (let i = 0; i < devices.length; i++) {
		let device = devices[i];
		switch (device.type) {
			case CONSTANTS.DEVICES.BME280:
				await arduinos[device.arduino].configureBME280(device.id);
				break;
			case CONSTANTS.DEVICES.QMP6988:
				await arduinos[device.arduino].configureQMP6988(device.id);
				break;
			case CONSTANTS.DEVICES.HX711:
				await arduinos[device.arduino].configureHX711(device.id, device.port);
				break;
			case CONSTANTS.DEVICES.DS18B20:
				await arduinos[device.arduino].configureDS18B20(device.id, device.port);
				break;
			default:
				//Ignore
		}
	}
}

/*
	* Loops
	*/

async function updateScreen() {
	switch (currentScreen) {
		case 0:
			await Interface.displayLoraInfo(arduinos[0], 0, CONFIG.times.send - (process.uptime() - times.send));
			currentScreen++;
			break;
		case 1: // BME280 or QMP6988
			await Interface.displayWeatherInfo(arduinos[0], 0, devices);
			currentScreen++;
			break;
		case 2: // HX711
            await Interface.displayWeights(arduinos[0], 0, currentArduinoOnScreen, devices);
			currentArduinoOnScreen ++;

			if(currentArduinoOnScreen >= arduinos.length) {
				currentArduinoOnScreen = 0;
				currentScreen++;
			}			
			break;
		case 3: // DS18B20
            await Interface.displayTemperatures(arduinos[0], 0, currentArduinoOnScreen, devices);
			currentArduinoOnScreen ++;

			if(currentArduinoOnScreen >= arduinos.length) {
				currentArduinoOnScreen = 0;
				currentScreen++;
			}			
			break;
		case 4: //Audio;
			await Interface.displayAudioInfo(arduinos[0], 0, devices);
			currentScreen = 0;
			break;
	}

	if (!(await arduinos[0].getSwitch(16)).value) {
		await Interface.displayPause(arduinos[0], 0);
	}
}

async function measure() {
	if (!(await arduinos[0].getSwitch(16)).value) {
		//Paused
		return;
	}

	for (let i = 0; i < devices.length; i++) {
		switch (devices[i].type) {
			case CONSTANTS.DEVICES.BME280:
				devices[i].measurements.push(await arduinos[devices[i].arduino].getBME280(devices[i].id));
				break;
			case CONSTANTS.DEVICES.QMP6988:
				devices[i].measurements.push(await arduinos[devices[i].arduino].getQMP6988(devices[i].id));
				break;
			case CONSTANTS.DEVICES.HX711:
				devices[i].measurements.push(await arduinos[devices[i].arduino].getHX711(devices[i].id));
				break;
			case CONSTANTS.DEVICES.DS18B20:
				devices[i].measurements.push(await arduinos[devices[i].arduino].getDS18B20(devices[i].id));
				break;
			case CONSTANTS.DEVICES.AUDIO:
				devices[i].measurements.push(await devices[i].object.getSample(CONFIG.hardware.audio.duration));

				console.log(devices[i].measurements);
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
				case CONSTANTS.DEVICES.QMP6988:
					average = getAverage(devices[i].measurements);
					if (average !== null) {

						/* 
							* BUGFIX: new ENV module gives garbled humidity and/or pressure data. Hence ignore.
							*/
						result.push(encoder.encodeTemperature(devices[i].caynenneId, average.temperature));

						let lastVal = devices[i].measurements.pop();
						devices[i].measurements = [lastVal];
					}

					break;
				case CONSTANTS.DEVICES.BME280:
					average = getAverage(devices[i].measurements);
					if (average !== null) {
						result.push(encoder.encodeRelativeHumidity(devices[i].caynenneId, average.humidity));
						result.push(encoder.encodeBarometricPressure(devices[i].caynenneId, average.pressure / 100)); //Pa -> hPa
						result.push(encoder.encodeTemperature(devices[i].caynenneId, average.temperature));

						let lastVal = devices[i].measurements.pop();
						devices[i].measurements = [lastVal];
					}

					break;
				case CONSTANTS.DEVICES.HX711:
					average = getAverage(devices[i].measurements);
					if (average !== null) {

						result.push(encoder.encodeAnalogOutput(devices[i].caynenneId, average.weight / 10000));

						let lastVal = devices[i].measurements.pop();
						devices[i].measurements = [lastVal];
					}
					break;
				case CONSTANTS.DEVICES.DS18B20:
					average = getAverage(devices[i].measurements);
					if (average !== null) {

						result.push(encoder.encodeTemperature(devices[i].caynenneId, average.temperature));

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
							result.push(encoder.encodeAnalogInput(devices[i].caynenneId + j, average[j]));
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