/*
 * Libraries
 */
const GPIO = require('onoff').Gpio;
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')


/*
 * Module to communicate with RAK811 Lora Hat
 */
module.exports = class{

    constructor(path, options) {
        this._port = new SerialPort(path, options);
        this._parser = new Readline();
        this._port.pipe(this._parser);
    }

    /*
     * General Functions
     */

    _sendSerial(message, okResponses = [], ignoreResponses = []) {
        return new Promise((resolve, reject) => {
            const callback = (line) => {
                for(let i=0; i < okResponses.length; i++) {
                    if(line.startsWith(okResponses[i])) {
                        this._parser.off('data', callback);
                        resolve(line);
                        return;
                    }
                }

                //Not Ok check if we may ignore
                for(let i=0; i < ignoreResponses.length; i++) {
                    if(line.trim() == "") {
                        //Ignore
                        return;
                    }

                    if(line.startsWith("at+recv=")) {
                        //ignore incoming messages
                        return;
                    }

                    if(line.startsWith(ignoreResponses[i])) {
                        //Ignore message
                        return;
                    }
                }

                //Else error
                this._parser.off('data', callback);
                reject(line);
            };
            
            this._parser.on('data', callback);
            this._port.write(message + "\r\n");
        });
    }

    /*
     * System functions
     */
    hardReset() {
        const pin = 17;
        const delay = 10;
        const delayPost = 2000;
    
        const reset = new GPIO(pin, 'out');
    
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

    softReset() {
        return this._sendSerial("at+reset=0", ["OK"], ["Selected"]);
    }

    async getVersion() {
        let result = await this._sendSerial("at+version", ["OK"]);
        return result.substr(2);
    }

    reload() {
        return this._sendSerial("at+reload", ["OK"], ["Selected"]);
    }

    setMode(mode) { // This will reset the device!
        return this._sendSerial("at+mode=" + mode, ["OK"], ["Selected"]);
    }

    async getMode() {
        let result = await this._sendSerial("at+mode", ["OK"]);
        return result.substr(2);
    }

    setRecvEx(mode) {
        return this._sendSerial("at+recv_ex=" + mode, ["OK"]);
    }

    async getRecvEx() {
        let result = await this._sendSerial("at+recv_ex", ["OK"]);
        return result.substr(2);
    }

    /*
     * LoraWan commands
     */

    /*
     * For documentation see RAK811 AT commands v 1.5
     */
    async getConfig(key) {
        let result = await this._sendSerial("at+get_config=" + key, ["OK"]);
        return result.substr(2);
    }

    setConfig(values = {}) {
        //TODO
    }

    async getBand() {
        let result = await this._sendSerial("at+band", ["OK"]);
        return result.substr(2);
    }

    setBand(band) {
        return this._sendSerial("at+band=" + band, ["OK"]);
    }

    joinABP() {
        return this._sendSerial("at+abp" + band, ["OK"]);
    }

    async getSignalStrength() {
        //TODO
    }

    async getDr() {
        let result = await this._sendSerial("at+dr", ["OK"]);
        return result.substr(2);
    }

    setDr(dr) {
        return this._sendSerial("at+dr=" + dr, ["OK"]);
    }

    async getLinkCount() {
        //TODO
    }

    setLinkCount() {
        //TODO
    }

    send() {

    }

    /*
     * Debug commands
     */
    
    debugSerial() {
        this._parser.on('data', (line) => {
            console.log(`[LOG] ${line}`)
        });
    }

}


function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
  	});
}