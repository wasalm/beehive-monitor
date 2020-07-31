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

    displayWeatherInfo: async (dev, id, humm = -1, press = -1, temp = -1) => {
        await dev.emptyScreen(id);
        await dev.writeScreen(id, 2, 2, "Weather info");

        await dev.writeScreen(id, 0, 5, "Humm:");
        await dev.writeScreen(id, 0, 6, "Press:");
        await dev.writeScreen(id, 0, 7, "Temp:");
        
        await dev.writeScreen(id, 13, 5, "%RH");
        await dev.writeScreen(id, 13, 6, "kPa");
        await dev.writeScreen(id, 13, 7, "°C");

        if(humm == -1) {
            await dev.writeScreen(id, 7, 5, "-");
        } else {
            await dev.writeScreen(id, 7, 5, Math.round(humm * 10)/10);
        }

        if(press == -1) {
            await dev.writeScreen(id, 7, 6, "-");
        } else {
            await dev.writeScreen(id, 7, 6, Math.round(press * 10/1000)/10);
        }

        if(temp == -1) {
            await dev.writeScreen(id, 7, 7, "-");
        } else {
            await dev.writeScreen(id, 7, 7, Math.round(temp * 10)/10);
        }
    },

    displayHiveInfo: async (dev, id, name, properties = []) => {
        await dev.emptyScreen(id);
        await dev.writeScreen(id, 2, 0, "Currently in");
        await dev.writeScreen(id, Math.floor((16 - name.length)/2), 3, name);

        let n = 7;
        for(let i=properties.length-1; i >= 0; i--) {
            let property = properties[i];
            await dev.writeScreen(id, 0, n, property.label + ":");
            await dev.writeScreen(id, 14, n, property.unit);
            await dev.writeScreen(id, 8, n, property.value);
            n--;
        }
    },

    displayAudioInfo: async (dev, id, data) => {
        console.log("TODO: displayAudioInfo");
    },
}