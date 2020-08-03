/*
 * Librarues
 */
const SerialPort = require('serialport')
const LoraPacket = require('lora-packet');
const { decoder } = require('cayenne-lpp'); // See https://www.npmjs.com/package/cayenne-lpp
const Readline = require('@serialport/parser-readline')

/*
 * Serial Configuration
 */
const port = new SerialPort("/dev/tty.usbserial-1420", { baudRate: 115200 })
const parser = new Readline()
port.pipe(parser)

/*
 * Event Handler
 */
parser.on('data', (line) => {
    // Trim line.
    line = line.trim().replace(/\0.*$/g,'');

    //We only handle one response:
    if(line.startsWith("at+recv_raw=")) {
        let data = line.substr(12).split(",");
        let RSSI = parseFloat(data[1]);
        let SNR = parseFloat(data[2]);

        let packet = LoraPacket.fromWire(Buffer.from(data[0], 'hex'));
        
        switch(packet.getMType()) {
            case "Unconfirmed Data Up":
                let devAddr = packet.getBuffers().DevAddr.toString('hex');
                let keys = getKeys(devAddr);

                console.log("Received packet from '" + devAddr + "' of type: " + packet.getMType());
                if(keys !== null) {
                    if(LoraPacket.verifyMIC(packet, keys.NwkSKey)) {
                        let payload = LoraPacket.decrypt(packet, keys.AppSKey, keys.NwkSKey);
                        switch(packet.getMType()) {
                            case "Unconfirmed Data Up":
                                handleUnconfirmedDataUp(payload, packet, RSSI, SNR);
                                break;
                        }
                    } else {
                        console.log("MIC is invalid for '"+devAddr+"'");
                    }
                } else {
                    console.log("No key found for '"+devAddr+"'");
                }
                break;
            default:
                console.log("Unhandled packet type: " + packet.getMType());
        }
    }
});

function handleUnconfirmedDataUp(payload, packet, rssi, snr) {
    console.log("RSSI: " + rssi + " SNR: " + snr);
    console.log("Decrypted (ASCII)='" + payload.toString() + "'");
    console.log("Decrypted (hex)='0x" + payload.toString('hex') + "'");

    const json = JSON.stringify(decoder.decode(payload));
    console.log(json);
}

function getKeys(devAddr) {
    //Temporary:
    if(devAddr == "00011500") {
        return {
           NwkSKey: Buffer.from('5D77C37101E7FDAC9C6D43397C164C05', 'hex'),
           AppSKey: Buffer.from('5C9354F9DACF6E62C051D7560F8E70F4', 'hex')
        };
    } else {
        return null;
    }
}