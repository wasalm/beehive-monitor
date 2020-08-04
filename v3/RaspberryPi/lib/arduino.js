/*
 * Libraries
 */
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')


/*
 * Module to communicate with the Seeeduino Lotus
 */
module.exports = class{

    constructor(path, options) {
        this._port = new SerialPort(path, options);
        this._parser = new Readline();
        this._port.pipe(this._parser);

        // Allow data to be ignored...
        this._parser.on('data', () => {});
    }

    /*
     * General Functions
     */

    _sendSerial(message, okResponse) {
        return new Promise((resolve, reject) => {
            const callback = (line) => {
                line = line.trim().replace(/\0.*$/g,'');

                if(line.startsWith(okResponse)) {
                    resolve(line);
                } else {
                    reject(line);
                }
                this._parser.off('data', callback);
            };
            
            this._parser.on('data', callback);
            this._port.write(message + "\n");
        });
    }

    /*
     * Reset
     */

    reset() {
        return this._sendSerial("R", "R");
    }

    /*
     * Configure
     */

    configureSSD1306(id) {
        let idStr = "";
        if(id < 10)
            idStr += "0";

        idStr += id;

        return  this._sendSerial("C" + idStr + "IISSD1306", "C" + idStr + "1");
    }

    configureBME280(id) {
        let idStr = "";
        if(id < 10)
            idStr += "0";

        idStr += id;

        return  this._sendSerial("C" + idStr + "IIBME280", "C" + idStr + "1");
    }

    configureHX711(id, port) {
        let idStr = "";
        if(id < 10)
            idStr += "0";

        idStr += id;

        return  this._sendSerial("C" + idStr + port + "HX711", "C" + idStr + "1");
    }

    configureDS18B20(id, port) {
        let idStr = "";
        if(id < 10)
            idStr += "0";

        idStr += id;

        return  this._sendSerial("C" + idStr + port + "DS18B20", "C" + idStr + "1");
    }

    configureSwitch(id, port) {
        let idStr = "";
        if(id < 10)
            idStr += "0";

        idStr += id;

        return  this._sendSerial("C" + idStr + port + "SWITCH", "C" + idStr + "1");
    }

    /* 
     * Get Commands
     */

    async getBME280(id){
        let idStr = "";
        if(id < 10)
            idStr += "0";

        idStr += id;

        let result = await this._sendSerial("G" + idStr, "G" + idStr + "1H");
        result = result.trim().split(/[GHPT]/g);
        return {
            humidity: parseFloat(result[2]),
            pressure: parseFloat(result[3]),
            temperature: parseFloat(result[4]),
        };
    }

    async getHX711(id){
        let idStr = "";
        if(id < 10)
            idStr += "0";

        idStr += id;

        let result = await this._sendSerial("G" + idStr, "G" + idStr + "1W");
        return {weight: parseFloat(result.substr(5))};
    }

    async getDS18B20(id){
        let idStr = "";
        if(id < 10)
            idStr += "0";

        idStr += id;

        let result = await this._sendSerial("G" + idStr, "G" + idStr + "1T");
        return {temperature: parseFloat(result.substr(5))};
    }

    async getSwitch(id){
        let idStr = "";
        if(id < 10)
            idStr += "0";

        idStr += id;

        let result = await this._sendSerial("G" + idStr, "G" + idStr + "1V");
        return {value: result.substr(5) == "1"};
    }

    /*
     * Screen commands
     */

    emptyScreen(id) {
        let idStr = "";
        if(id < 10)
            idStr += "0";

        idStr += id;

        return  this._sendSerial("E" + idStr, "E" + idStr + "1");
    }

    writeScreen(id, x, y, str) {
        let idStr = "";
        if(id < 10)
            idStr += "0";

        idStr += id;

        return  this._sendSerial("W" + idStr + x.toString(16) + y.toString(16) + str, "W" + idStr + "1");
    }

    /*
     * Debug commands
     */
    
    debugSerial() {
        this._parser.on('data', (line) => {
            console.log(`[LOG] ${line}`)
        });
    }

    async getFreeMemory() {
        let result = await this._sendSerial("M", "M");
        return parseInt(result.substr(1));
    }

}