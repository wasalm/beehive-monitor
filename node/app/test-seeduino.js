const CL = require("./lib/arduino.js");
let test = new CL("/dev/ttyUSB0", { baudRate: 115200 });

(async () => {
	test.debugSerial();
	await test.reset();
	await test.configureSSD1306(0);
    
    // await test.configureBME280(1);
	// await test.configureHX711(2, "A0");
    // await test.configureDS18B20(3, "D2");
    
	console.log(await test.getFreeMemory());
	await test.emptyScreen(0);
    await sleep(1000);
    
    //Currently in
    await test.writeScreen(0, 2, 0, "Currently in");
    await test.writeScreen(0, 4, 3, "Kast 1");
    await test.writeScreen(0, 0, 6, "Temp:");
    await test.writeScreen(0, 0, 7, "Mass:");
    await test.writeScreen(0, 14, 6, "C");
    await test.writeScreen(0, 14, 7, "Kg");
    await test.writeScreen(0, 8, 6, "34.1");
    await test.writeScreen(0, 8, 7, "27.6");
    
    await sleep(5000);
    //Last time
    await test.emptyScreen(0);
    await test.writeScreen(0, 2, 0, "Last time in");
    await test.writeScreen(0, 4, 3, "Kast 1");
    await test.writeScreen(0, 0, 6, "Temp:");
    await test.writeScreen(0, 0, 7, "Mass:");
    await test.writeScreen(0, 14, 6, "C");
    await test.writeScreen(0, 14, 7, "Kg");
    await test.writeScreen(0, 8, 6, "34.1");
    await test.writeScreen(0, 8, 7, "27.6");

    await sleep(5000);
    //Weather info
    await test.emptyScreen(0);
    await test.writeScreen(0, 2, 2, "Weather info");

    await test.writeScreen(0, 0, 5, "Humm:");
    await test.writeScreen(0, 0, 6, "Press:");
    await test.writeScreen(0, 0, 7, "Temp:");
    
    await test.writeScreen(0, 13, 5, "%RH");
    await test.writeScreen(0, 13, 6, "hPa");
    await test.writeScreen(0, 13, 7, "C");

    await test.writeScreen(0, 7, 5, "40.3");
    await test.writeScreen(0, 7, 6, "12.3");
    await test.writeScreen(0, 7, 7, "24.6");

    await sleep(5000);
    //Signal 
    await test.emptyScreen(0);
    await test.writeScreen(0, 2, 0, "Next message");

    await test.writeScreen(0, 4, 2, "at");
    await test.writeScreen(0, 7, 2, "12");
    await test.writeScreen(0, 9, 2, ":");
    await test.writeScreen(0, 10, 2, "53");
    
    await test.writeScreen(0, 1, 4, "Signal strength");

    await test.writeScreen(0, 0, 6, "RSSI:");
    await test.writeScreen(0, 0, 7, "SNR:");
    await test.writeScreen(0, 13, 6, "dbm");
    await test.writeScreen(0, 13, 7, "db");
    await test.writeScreen(0, 7, 6, "-119");
    await test.writeScreen(0, 7, 7, "-4.8");

    

    // console.log(await test.getBME280(1));
	// console.log(await test.getHX711(2));
	// console.log(await test.getDS18B20(3));
})();


function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
  	});
}