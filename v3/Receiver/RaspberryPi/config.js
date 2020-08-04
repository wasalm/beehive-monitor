module.exports = {
    serial: {
        path: "/dev/tty.usbserial-1420",
        baudRate: 115200
    },

    lora: {
        frequency: 868100000,
        spreadingFactor: 9,
        syncWord: "34",
        devAddr: "00011500",
        NwkSKey: "5D77C37101E7FDAC9C6D43397C164C05",
        AppSKey: "5C9354F9DACF6E62C051D7560F8E70F4"
    },

    keys: {
        general: "123456",
        kast1: "123456",
        kast2: "123456",
        kast3: "123456"
    },

    pinMap: {
        "temperature_1": "general",
        "temperature_2": "kast1",
    }
}