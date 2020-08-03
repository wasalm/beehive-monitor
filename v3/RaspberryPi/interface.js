const CONSTANTS = require("./constants.js");

module.exports = {
    displayLoraInfo: async (dev, id, time = 0 /* in seconds */) => {
        await dev.emptyScreen(id);
        await dev.writeScreen(id, 2, 2, "Next message");
        await dev.writeScreen(id, 4, 5, "at");

        time = Math.round(time);
        let s = time % 60;
        time = (time - s)/60; // time is now in minutes
        let m = time % 60;
        time = (time - m)/60; // time is now in hours
        let h = time;
        
        if(m < 10) {
            m = "0" + m;
        }

        if(h < 10) {
            h = "0" + h;
        }
        await dev.writeScreen(id, 7, 5, h + ":" + m);
    },

    displayWeatherInfo: async (dev, id, devices) => {
        await dev.emptyScreen(id);
        await dev.writeScreen(id, 2, 2, "Weather info");

        await dev.writeScreen(id, 0, 5, "Humm:");
        await dev.writeScreen(id, 0, 6, "Press:");
        await dev.writeScreen(id, 0, 7, "Temp:");
        
        await dev.writeScreen(id, 13, 5, "%RH");
        await dev.writeScreen(id, 13, 6, "kPa");
        await dev.writeScreen(id, 13, 7, "°C");

        for(let i=0; i<devices.length; i++) {
            if(devices[i].type == CONSTANTS.DEVICES.BME280) {
                if(devices[i].measurements.length == 0) {
                    continue;
                }
                
                let measurement = devices[i].measurements[devices[i].measurements.length - 1];
                await dev.writeScreen(id, 7, 5, Math.round(measurement.humidity * 10)/10);
                await dev.writeScreen(id, 7, 6, Math.round(measurement.pressure * 10/1000)/10);
                await dev.writeScreen(id, 7, 7, Math.round(measurement.temperature * 10)/10);
                
                return;
            }
        }

        // Noting found
        await dev.writeScreen(id, 7, 5, "-");
        await dev.writeScreen(id, 7, 6, "-");
        await dev.writeScreen(id, 7, 7, "-");
    },


    displayWeights: async (dev,id, devices) => {
        await dev.emptyScreen(id);
        await dev.writeScreen(id, 4, 1, "Weights");
        
        await dev.writeScreen(id, 0, 3, "Port");
        await dev.writeScreen(id, 11, 3, "Value");
        await dev.writeScreen(id, 6, 3, "|");
        await dev.writeScreen(id, 0, 4, "----------------");
        
        await dev.writeScreen(id, 6, 5, "|");
        await dev.writeScreen(id, 6, 6, "|");
        await dev.writeScreen(id, 6, 7, "|");

        let n = 5;
        for(let i=0; i<devices.length; i++) {
            if(devices[i].type == CONSTANTS.DEVICES.HX711) {
                await dev.writeScreen(id, 0, n, devices[i].port);

                if(devices[i].measurements.length != 0) {
                    let measurement = devices[i].measurements[devices[i].measurements.length - 1];

                    await dev.writeScreen(id, 8, n, measurement.weight);
                }
                n++;
            }
        }
    },

    displayTemperatures: async (dev,id, devices) => {
        await dev.emptyScreen(id);
        await dev.writeScreen(id, 2, 1, "Temperatures");
        
        await dev.writeScreen(id, 0, 3, "Port");
        await dev.writeScreen(id, 11, 3, "Value");
        await dev.writeScreen(id, 6, 3, "|");
        await dev.writeScreen(id, 0, 4, "----------------");
        
        await dev.writeScreen(id, 6, 5, "|");
        await dev.writeScreen(id, 6, 6, "|");
        await dev.writeScreen(id, 6, 7, "|");

        let n = 5;
        for(let i=0; i<devices.length; i++) {
            if(devices[i].type == CONSTANTS.DEVICES.DS18B20) {
                await dev.writeScreen(id, 0, n, devices[i].port);

                if(devices[i].measurements.length != 0) {
                    let measurement = devices[i].measurements[devices[i].measurements.length - 1];

                    await dev.writeScreen(id, 8, n, Math.round(measurement.temperature * 10)/10);
                    await dev.writeScreen(id, 14, n, "°C");
                }
                n++;
            }
        }
    },

    displayAudioInfo: async (dev, id, devices) => {
        await dev.emptyScreen(id);
        await dev.writeScreen(id, 2, 1, "Audio signal");
        
        for(let i=0; i<devices.length; i++) {
            if(devices[i].type == CONSTANTS.DEVICES.AUDIO) {
                if(devices[i].measurements.length != 0) {
                    let measurement = devices[i].measurements[devices[i].measurements.length - 1];

                    let min = Math.min.apply(Math, Object.values(measurement));
                    let max = Math.max.apply(Math, Object.values(measurement));

                    await writeBar(dev, id, 3, measurement.s_bin098_146, min, max);
                    await writeBar(dev, id, 4, measurement.s_bin146_195, min, max);
                    await writeBar(dev, id, 5, measurement.s_bin195_244, min, max);
                    await writeBar(dev, id, 6, measurement.s_bin244_293, min, max);
                    await writeBar(dev, id, 7, measurement.s_bin293_342, min, max);
                    await writeBar(dev, id, 8, measurement.s_bin342_391, min, max);
                    await writeBar(dev, id, 9, measurement.s_bin391_439, min, max);
                    await writeBar(dev, id, 10, measurement.s_bin439_488, min, max);
                    await writeBar(dev, id, 11, measurement.s_bin488_537, min, max);
                    await writeBar(dev, id, 12, measurement.s_bin537_586, min, max);
                }
                return;
            }
        }
    },
}

async function writeBar(dev, id, x, val, min, max) {
    val = Math.round((val - min) / (max - min) * 16);

    // Lowest bar
    if(val >= 4) {
        await dev.writeScreen(id, x, 7, "\x9D");

        //Second bar
        if(val >= 8) {
            await dev.writeScreen(id, x, 6, "\x9D");
    
            //Third bar
            if(val >= 12) {
                await dev.writeScreen(id, x, 5, "\x9D");
                
                //Top bar
                switch(val) {
                    case 13:
                        await dev.writeScreen(id, x, 4, "\x9E");
                        break;
                    case 14:
                        await dev.writeScreen(id, x, 4, "\x91");
                        break;
                    case 15:
                        await dev.writeScreen(id, x, 4, "\x9F");
                        break;
                    case 16:
                        await dev.writeScreen(id, x, 4, "\x9D");
                        break;
                }
    
            } else {
                switch(val) {
                    case 9:
                        await dev.writeScreen(id, x, 5, "\x9E");
                        break;
                    case 10:
                        await dev.writeScreen(id, x, 5, "\x91");
                        break;
                    case 11:
                        await dev.writeScreen(id, x, 5, "\x9F");
                        break;
                }
            }
        } else {
            switch(val) {
                case 5:
                    await dev.writeScreen(id, x, 6, "\x9E");
                    break;
                case 6:
                    await dev.writeScreen(id, x, 6, "\x91");
                    break;
                case 7:
                    await dev.writeScreen(id, x, 6, "\x9F");
                    break;
            }
        }

    } else {
        switch(val) {
            case 1:
                await dev.writeScreen(id, x, 7, "\x9E");
                break;
            case 2:
                await dev.writeScreen(id, x, 7, "\x91");
                break;
            case 3:
                await dev.writeScreen(id, x, 7, "\x9F");
                break;
        }
    }
}