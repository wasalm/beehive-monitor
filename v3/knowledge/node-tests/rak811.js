const Gpio = require('onoff').Gpio;
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const port = new SerialPort("/dev/serial0", { baudRate: 115200 })

const parser = new Readline()
port.pipe(parser)

parser.on('data', line => console.log(`> ${line}`));

function rak811HardReset() {
	const pin = 17;
	const delay = 10;
	const delayPost = 2000;

	const reset = new Gpio(pin, 'out');

	return new Promise((resolve, reject) => {
		reset.writeSync(0);
		setTimeout(() => {
			reset.writeSync(1);
			setTimeout(() => {
				resolve();
			}, delayPost);
		}, delay);
	});
}

function sendMsg(msg) {
	return new Promise((resolve, reject) => {
		const callback = (line) => {
			if(line.startsWith("at+recv=")) {
				//ignore
				return;
			}

			if(line.startsWith("OK")) {
				resolve(line.substr(2));
			} else {
				reject(line);
			}
			parser.off('data', callback);
		};
		parser.on('data', callback);
		port.write(msg + "\r\n");
	});
}

console.log("RAK811 TEST");
// For documentation see source of https://github.com/AmedeeBulle/pyrak811/blob/c82e3a5f3857432221fec453d265ccc18ca958df/rak811/rak811.py#L215


(async () => {
	try{
		await rak811HardReset();

		await sendMsg("at+recv_ex=0");
		await sendMsg("at+band=EU868"); // Set band to European bands (868MHz)

		const devAddr = "26011500";
		const nwksKey = "5D77C37101E7FDAC9C6D43397C164C05";
		const appsKey = "5C9354F9DACF6E62C051D7560F8E70F4";
		const pwrLevel = "0";
		const dr = "0";

		let config = `at+set_config=dev_addr:${devAddr}&nwks_key:${nwksKey}&apps_key:${appsKey}&pwr_level:${pwrLevel}&dr:${dr}&duty:off`;
		console.log(config);
		await sendMsg(config); //Set ABP config

		console.log("test:");
		await sendMsg("at+get_config=dev_addr");
		await sendMsg("at+get_config=nwks_key");
		await sendMsg("at+get_config=apps_key");
		await sendMsg("at+get_config=pwr_level");
		await sendMsg("at+get_config=dr");

		console.log("join abp");
		await sendMsg("at+join=abp");
		await sendMsg("at+link_cnt=24,0");
		await sendMsg("at+send=0,1,010203040506"); //Send unconfirmed on port 1 text: %5a
		

		await sendMsg("at+signal");
		// await sleep(10000);
		//console.log("msg2");
		//await sendMsg("at+send=1,1,0708090A0B0C"); //Send unconfirmed on port 1 text: %5a
		//await sendMsg("at+signal");

	} catch(e) {
		console.error(JSON.stringify(e));
	}
})();

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
  	});
}