const CL = require("./lib/rak811.js");
let test = new CL("/dev/serial0", { baudRate: 115200 });

(async () => {
	test.debugSerial();
    await test.hardReset();

    /*
     * System functions
     */
    console.log(); console.log("--- SYSTEM FUNCTIONS ---"); console.log();

    console.log("getVersion");
    console.log(await test.getVersion());
    
    console.log("setMode");
    await test.setMode(1); // Set p2p
    await test.rfConfig(); // default
    await test.rxContinue();
    await test.txContinue(1, 1000, "Hallo world"); // default


    
})();


function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
  	});
}