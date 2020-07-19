const CL = require("./lib/arduino.js");
let test = new CL("/dev/ttyUSB0", { baudRate: 115200 });

(async () => {
	test.debugSerial();
	await test.reset();
	await test.configureSSD1306(0);
    
    
    
	console.log(await test.getFreeMemory());
	await test.emptyScreen(0);
    await sleep(1000);
    
    //Currently in
    await test.writeScreen(0, 2, 0, "Currently in");
    await test.writeScreen(0, 4, 3, "Kast 1");
    await test.writeScreen(0, 0, 6, "Temp:");
    await test.writeScreen(0, 0, 7, "Mass:");
    await test.writeScreen(0, 14, 6, "°C");
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
    await test.writeScreen(0, 14, 6, "°C");
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
    await test.writeScreen(0, 13, 7, "°C");

    await test.writeScreen(0, 7, 5, "40.3");
    await test.writeScreen(0, 7, 6, "12.3");
    await test.writeScreen(0, 7, 7, "24.6");

    await sleep(5000);
    //Next Message
    await test.emptyScreen(0);
    await test.writeScreen(0, 2, 2, "Next message");

    await test.writeScreen(0, 4, 5, "at");
    await test.writeScreen(0, 7, 5, "12");
    await test.writeScreen(0, 9, 5, ":");
    await test.writeScreen(0, 10, 5, "53");
    
    await sleep(5000);
    //Audio
    await test.emptyScreen(0);
    await test.writeScreen(0, 2, 1, "Audio Signal");

    //sizes = \x9F -> 0x9D -> 0x91 -> 0x9E


    //await test.writeScreen(0, 2, 5, "\x90 \x91 \x92 \x93 \x94 \x95");
    //await test.writeScreen(0, 2, 6, "\x96 \x97 \x98 \x99 \x9A \x9B");
    await test.writeScreen(0, 2, 6, "  \x9D");
    await test.writeScreen(0, 2, 7, "\x91 \x9D \x9E \x9F \x91 \x9D \x9E \x9F");

    

    // console.log(await test.getBME280(1));
	// console.log(await test.getHX711(2));
	// console.log(await test.getDS18B20(3));
})();


function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
  	});
}