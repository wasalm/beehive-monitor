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
    
    // console.log("softReset");
    // await test.softReset();

    // console.log("reload");
    // await test.reload();

    console.log("setMode");
    await test.setMode(0);

    console.log("getMode");
    console.log(await test.getMode());

    console.log("setRecvEx");
    await test.setRecvEx(0);

    console.log("getRecvEx");
    console.log(await test.getRecvEx());

    /*
     * Lora functions
     */
    console.log(); console.log("--- LORA FUNCTIONS ---"); console.log();

    // console.log("getConfig - dev_addr");
    // console.log(await test.getConfig("dev_addr"));

    // console.log("setConfig");
    // console.log(await test.setConfig({}));
    
    console.log("getBand");
    console.log(await test.getBand());

    console.log("setBand");
    await test.setBand("EU868");
    
    // joinABP() {

    // console.log("getSignalStrength");
    // console.log(await test.getSignalStrength());

    console.log("getDr");
    console.log(await test.getDr());

    console.log("setDR");
    await test.setDr(0);

    // getLinkCount() {
    // setLinkCount() {
    // send() {



})();


function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
  	});
}