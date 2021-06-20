/*
 * Libraries
 */
const { decoder } = require('cayenne-lpp');
const fs = require('fs');
const readline = require('readline');

/*
 * Configuration
 */

let keys = [
    "relative_humidity_1",
    "barometric_pressure_1",
    "temperature_1",
    "analog_output_10",
    "analog_output_12",
    "analog_output_5",
];


/*
 * Main code
 */

const readInterface = readline.createInterface({
    input: fs.createReadStream('log-lora.txt'),
    output: null,
    console: false
});

let line = "n;date";
for(let i = 0; i< keys.length; i++) {
    line += ";";
    line += keys[i];
}
console.log(line);

let n=1;

readInterface.on('line', (line) => {
    line = line.trim();
    line = line.split("|");

    let result = {};

    // Time
    result.time = new Date(line[0]); // In unix time

    // Signal strength
    result.rssi = parseFloat(line[1]);
    result.snr = parseFloat(line[2]);

    // Payload
    let buffer = Buffer.from(line[3], 'hex');
    let payload = decoder.decode(buffer);


    for (let i = 0; i < payload.length; i++) {
        for(let j = 0; j< keys.length; j++) {
            if(keys[j] in payload[i]) {
                result[keys[j]] = payload[i][keys[j]];
            }
        }
    }

    if(keys[0] in result) {
        // console.log(result);

        let output = n;
        output += ";" + result.time.toISOString();

        for(let i=0; i<keys.length; i++) {
            output += ";";
            output += (result[keys[i]] + "").replace(/\./g, ",");
        }
        console.log(output);
        n++;
    }
});
