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

    setConfig(config = {}) {
        let result = [];
        const keys = Object.keys(config);
        for(let i=0; i<keys.length; i++) {
            result.push(keys[i] + ":" + config[keys[i]]);
        }

        result = result.join('&');
        
        return this._sendSerial("at+set_config=" + result, ["OK"]);
    }

    async getBand() {
        let result = await this._sendSerial("at+band", ["OK"]);
        return result.substr(2);
    }

    setBand(band) {
        return this._sendSerial("at+band=" + band, ["OK"]);
    }

    joinABP() {
        return this._sendSerial("at+join=abp", ["OK"]);
    }

    async getSignalStrength() {
        let result = await this._sendSerial("at+signal", ["OK"]);
        result = result.substr(2);
        result = result.split(",");

        result = {
            rssi: parseFloat(result[0].trim()),
            snr: parseFloat(result[1].trim())
        };
        return result;
    }

    async getDr() {
        let result = await this._sendSerial("at+dr", ["OK"]);
        return result.substr(2);
    }

    setDr(dr) {
        return this._sendSerial("at+dr=" + dr, ["OK"]);
    }

    async getLinkCount() {
        let result = await this._sendSerial("at+link_cnt", ["OK"]);
        result = result.substr(2);
        result = result.split(",");

        result = {
            up: parseInt(result[0].trim()),
            down: parseInt(result[1].trim())
        };
        return result;
    }

    setLinkCount(up, down) {
        return this._sendSerial("at+link_cnt=" + up + "," + down, ["OK"]);
    }

    send(message, port=1, confirmed=false) {
        let c = "0";
        if(confirmed) {
            c = "1";
        }

        let m = "";
        for(let i=0; i<message.length; i++) {
            var char = message.charCodeAt(i).toString(16);
            if(char.length == 1) {
                char = "0" + char;
            }
            m += char;
        }
        return this._sendSerial("at+send="+c+","+port+","+m, ["OK"]);
    }

    /*
     * Lora P2P
     */

    rfConfig(freq = 868100000, sf = 12, bw = 0 /* 125 */, cr = 1 /* 4/5 */, prlen = 8, pwr = 20) {
        return this._sendSerial("at+rf_config=" + freq + "," + sf + "," + bw + "," + cr + "," + prlen + "," + pwr, ["OK"]);
    }

    txContinue(count, interval, message) {
        let m = "";
        for(let i=0; i<message.length; i++) {
            var char = message.charCodeAt(i).toString(16);
            if(char.length == 1) {
                char = "0" + char;
            }
            m += char;
        }
        return this._sendSerial("at+txc="+count+","+interval+","+m, ["OK"]);
    }

    rxContinue() {
        return this._sendSerial("at+rxc=1", ["OK"]);
    }

    txStop() {
        return this._sendSerial("at+tx_stop", ["OK"]);
    }

    rxStop() {
        //at+rx_stop\r\n
        return this._sendSerial("at+rx_stop", ["OK"]);
    }

    clearStatus() {
        return this._sendSerial("at+status=0", ["OK"]);
    }

    async getStatus() {
        let result = await this._sendSerial("at+status", ["OK"]);
        result = result.substr(2);
        result = result.split(",");

        result = {
            TxSuccessCnt: parseInt(result[0].trim()),
            TxErrCnt: parseInt(result[1].trim()),
            RxSuccessCnt: parseInt(result[1].trim()),
            RxTimeOutCnt: parseInt(result[1].trim()),
            RxErrCnt: parseInt(result[1].trim()),
            Rssi: parseInt(result[1].trim()),
            Snr: parseInt(result[1].trim()),
        };
        return result;
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