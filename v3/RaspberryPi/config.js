const CONSTANTS = require("./constants")

module.exports = {
    times: { // In Seconds
        screen: 3,
        measurement: 10,
        send: 75 * 60, // Will be devided by number of nodes
        reset: 24 * 60 * 60
    },

    hardware: {
        arduino: {
            path: "/dev/ttyUSB0",
            baudRate: 115200
        },

        audio: {
            device: "plughw:1,0",
            bitRate: 16000,
            duration: 0.1
        },

        rak811: {
            path: "/dev/serial0",
            baudRate: 115200,
            config: {
                pwr_level: "0",
                adr: "off",
                dr: "0",
                public_net: "on",
                ch_mask: "0,00FF",
                duty: "off",
                class: "0"
            }
        }
    },

    nodes: {
        weather: {
            general: { //Special name
                name: "Weather info",
                dev_addr: "26011500",
                nwks_key: "5D77C37101E7FDAC9C6D43397C164C05",
                apps_key: "5C9354F9DACF6E62C051D7560F8E70F4"
            },
        },

        audio: {
            kast1: {
                name: "Audio kast 1",
                dev_addr: "26011500",
                nwks_key: "5D77C37101E7FDAC9C6D43397C164C05",
                apps_key: "5C9354F9DACF6E62C051D7560F8E70F4"
            }
        },

        general: {
            kast1: {
                name: "Kast 1",
                dev_addr: "26011500",
                nwks_key: "5D77C37101E7FDAC9C6D43397C164C05",
                apps_key: "5C9354F9DACF6E62C051D7560F8E70F4"
            }
        }
    },

    devices: [
        // General
        {
            type: CONSTANTS.DEVICES.BME280,
            path: CONSTANTS.PATHS.I2C,
            node: CONSTANTS.NODES.WEATHER + ".general"
        },

        // Kast 1
        {
            type: CONSTANTS.DEVICES.HX711,
            path: CONSTANTS.PATHS.A0,
            node: CONSTANTS.NODES.GENERAL + ".kast1"
        },
        {
            type: CONSTANTS.DEVICES.DS18B20,
            path: CONSTANTS.PATHS.D2,
            node: CONSTANTS.NODES.GENERAL + ".kast1"
        },

        //Audio (Kast 1)
        {
            type: CONSTANTS.DEVICES.AUDIO,
            path: CONSTANTS.PATHS.AUDIO,
            node: CONSTANTS.NODES.AUDIO + ".kast1"
        }
    ]
}