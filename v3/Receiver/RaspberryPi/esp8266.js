/*
 * Libraries
 */
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

        // Allow data to be ignored...
        this._parser.on('data', () => {});
    }

    /*
     * General Functions
     */

    _sendSerial(message, okResponses = ["ok"], ignoreResponses = ["at+recv_raw="], wait=false) {
        return new Promise((resolve, reject) => {
            const callback = (line) => {
                line = line.trim().replace(/\0.*$/g,'');

                for(let i=0; i < okResponses.length; i++) {
                    if(line.startsWith(okResponses[i])) {
                        this._parser.off('data', callback);
                        resolve(line);
                        return;
                    }
                }

                //Not Ok check if we may ignore
                for(let i=0; i < ignoreResponses.length; i++) {
                    if(line == "") {
                        //Ignore
                        return;
                    }

                    console.log(">" . line);
                    if(line.startsWith(ignoreResponses[i])) {
                        //Ignore message
                        return;
                    }
                }

                // else error
                if(!wait) {
                    this._parser.off('data', callback);
                    reject(line);
                }
            };
            
            this._parser.on('data', callback);
            this._port.write(message + "\n");
        });
    }

    /*
     * System functions
     */

    softReset() {
        return this._sendSerial("at+reset", ['LoRa Single Channel Receiver'], [], true);
    }

    receive(callback) {
        this._parser.on('data', (line) => {
            line = line.trim().replace(/\0.*$/g,'');

            if(line.startsWith("at+recv_raw")) {
                line = line.split(',');
                let rssi = parseFloat(line[1]);
                let snr = parseFloat(line[2]);

                line = line[0].substr(12);
                let payload = Buffer.from(line, 'hex');
                callback(payload, rssi, snr);
            }
        });

        return this._sendSerial("at+receive"); 
    }

    setFrequency(frequency) {
        return this._sendSerial("at+frequency=" + frequency); 
    }

    setSpreadingFactor(sf) {
        return this._sendSerial("at+spreadingfactor=" + sf); 
    }

    setSyncWord(sw) {
        return this._sendSerial("at+syncword=" + sw); 
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