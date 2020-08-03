const CONSTANTS = require("./constants")

module.exports = {
    times: { // In Seconds
        screen: 3,
        measurement: 10,
        send: 20, //test 10 * 60
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
                dev_addr: "00011500",
                nwks_key: "5D77C37101E7FDAC9C6D43397C164C05",
                apps_key: "5C9354F9DACF6E62C051D7560F8E70F4",
                pwr_level: "0",
                adr: "off",
                dr: "0",
                public_net: "on",
                ch_mask: "0,00FF",
                duty: "off",
                class: "0"
            }
        }
    }
}