const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const port = new SerialPort("/dev/ttyUSB0", { baudRate: 115200 })

const parser = new Readline()
port.pipe(parser)

parser.on('data', line => console.log(`> ${line}`));

function sendMsg(msg, okResponse) {
	return new Promise((resolve, reject) => {
		const callback = (line) => {
			if(line.startsWith(okResponse)) {
				resolve(line);
			} else {
				reject(line);
			}
			parser.off('data', callback);
		};
		parser.on('data', callback);
		port.write(msg + "\n");
	});
}

console.log("ARDUINO TEST");

(async () => {
	try{
		await sendMsg("R", "R");
		await sendMsg("C00IISSD1306", "C001");
		await sendMsg("C01IIBME280", "C011");
		data = await sendMsg("G01", "G011");
		console.log(data);

		await sendMsg("W0010Hallo iedereen", "W001");

	} catch(e) {
		console.error(JSON.stringify(e));
	}
})();

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
  	});
}