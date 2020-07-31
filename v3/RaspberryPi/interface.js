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
        console.log("TODO: displayAudioInfo");
    },
}