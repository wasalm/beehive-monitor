/*
 * Libraries
 */
const { decoder } = require('cayenne-lpp');
const fs = require('fs');
const readline = require('readline');

/*
 * Configuration
 */

let keyTemperature = "temperature_1";
let keyWeight = "analog_output_10";
let scaleFactor = 0.33;
let maxVal = -9.5;

/*
 * Main code
 */
let dataTemperature = [];
let dataWeight = [];
let data = [];

const readInterface = readline.createInterface({
    input: fs.createReadStream('log-lora.txt'),
    output: null,
    console: false
});

readInterface.on('line', (line) => {
    line = line.trim();
    line = line.split("|");

    let result = {};

    // Time
    result.time = Date.parse(line[0]); // In unix time

    // Signal strength
    result.rssi = parseFloat(line[1]);
    result.snr = parseFloat(line[2]);

    // Payload
    let buffer = Buffer.from(line[3], 'hex');
    let payload = decoder.decode(buffer);

    for (let i = 0; i < payload.length; i++) {
        if (keyTemperature in payload[i]) {
            result.temperature = payload[i][keyTemperature];
        }

        if (keyWeight in payload[i]) {
            result.weight = payload[i][keyWeight];
        }
    }

    if ("temperature" in result) {
        dataTemperature.push(result);
    }

    if ("weight" in result) {
        dataWeight.push(result);
    }
});

readInterface.on('close', () => {
    //First we combine all data using interpolation depending on time.
    for (let i = 0; i < dataWeight.length; i++) {
        let weight = dataWeight[i].weight;
        let time = dataWeight[i].time;

        let lowerTemp = null;
        let heigherTemp = null;

        for (let j = 0; j < dataTemperature.length; j++) {
            let item = dataTemperature[j];
            if(item.time <= time) {
                if(lowerTemp === null) {
                    lowerTemp = item;
                } else {
                    if(item.time > lowerTemp.time) {
                        lowerTemp = item;
                    }
                }
            }

            if(item.time >= time) {
                if(heigherTemp === null) {
                    heigherTemp = item;
                } else {
                    if(item.time < heigherTemp.time) {
                        heigherTemp = item;
                    }
                }
            }
        }

        if(lowerTemp !== null &&  heigherTemp !== null) {
            let temperature = null;

            if(lowerTemp === null) {
                temperature = heigherTemp.temperature;
            } else {
                if(heigherTemp === null) {
                    temperature = lowerTemp.temperature;
                } else {
                    if(lowerTemp.time == heigherTemp.time) {
                        temperature = lowerTemp.temperature;
                    } else {
                        temperature = lowerTemp.temperature;
                        temperature += (heigherTemp.temperature - lowerTemp.temperature)*(time - lowerTemp.time)/(heigherTemp.time - lowerTemp.time);
                    }
                }
            }

            if(weight < maxVal) {
                data.push({
                    "t": temperature,
                    "w": weight
                })            
            }
        }
    }

    /*
     * Model is w = A + b t
     * Hence error is \sum_i (A + B t_i - w_i)^2
     * Define 
     *     St = \sum_i t_i,
     *     Sw = \sum_i w_i
     *     St2 = \sum_i t_i^2
     *     Stw = \sum_i w_i * t_i
     *     n = \sum_i 1
     * 
     * note 
     *     1/2 * \del E / \del A = A n + b St - Sw = 0
     *     1/2 * \del E / \del B = A St + b St2 - Stw = 0
     */

    let stats = {
        St: 0, 
        Sw: 0,
        St2: 0,
        Stw: 0, 
        n: 0
    };
    
    for(let i=0; i< data.length; i++) {
        let item = data[i];

        stats.St += item.t;
        stats.Sw += item.w;

        stats.St2 += item.t * item.t;
        stats.Stw += item.t * item.w;

        stats.n ++;
    }

    /*
     * Need to solve the equations:
     *     A * n  + B * St  = Sw
     *     A * St + B * St2 = Stw
     * 
     *     A + B * St/n = Sw/n
     *     A + B * St2/St = Stw/St
     * 
     *     A + B * St/n = Sw/n 
     *     B * (St2/St - St/n) = Stw/St - Sw/n
     * 
     *     A = (Sw - B * St)/n
     */

    let B = ((stats.Stw / stats.St) - (stats.Sw/ stats.n)) / ((stats.St2 / stats.St) - (stats.St/ stats.n));
    let A = (stats.Sw - B * stats.St)/stats.n;

    // Output result
    console.log("Temperature;val;Weight;CorrectedWeight");
    for(let i=0; i< data.length; i++) {
        let item = data[i];
        
        let result = item.t + ";" + item.w + ";";

        let correctedWeight1 = (item.w - stats.Sw/stats.n) * scaleFactor;
        result += correctedWeight1 * 1000;
        result += ";"

        let correctedWeight2 = (item.w - A - B * item.t) * scaleFactor;
        result += correctedWeight2 * 1000;

        result = result.replace(/\./g, ",");
        console.log(result);
    }
});
