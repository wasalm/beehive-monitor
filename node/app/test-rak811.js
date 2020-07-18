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

    console.log("setConfig");
    await test.setConfig({
        dev_addr: "26011500",
        nwks_key: "5D77C37101E7FDAC9C6D43397C164C05",
        apps_key: "5C9354F9DACF6E62C051D7560F8E70F4"
    });

    console.log("setConfig 2");
    await test.setConfig({
        public_net: "on",
        pwr_level: "0",
        dr: "0",
        duty: "off"
    });

    console.log("getConfig - dev_addr");
    console.log(await test.getConfig("dev_addr"));
    console.log("getConfig - nwks_key");
    console.log(await test.getConfig("nwks_key"));
    console.log("getConfig - apps_key");
    console.log(await test.getConfig("apps_key"));


    console.log("getBand");
    console.log(await test.getBand());

    console.log("setBand");
    await test.setBand("EU868");
    
    console.log("joinABP");
    await test.joinABP();

    console.log("getSignalStrength");
    console.log(await test.getSignalStrength());

    console.log("getDr");
    console.log(await test.getDr());

    console.log("setDR");
    await test.setDr(0);

    console.log("setLinkCount");
    await test.setLinkCount(30,0);

    console.log("getLinkCount");
    console.log(await test.getLinkCount());
    

    await test.setLinkCount("Hello world", 1, false);

    await sleep(10000);
    await test.setMode(0);

})();


function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
  	});
}