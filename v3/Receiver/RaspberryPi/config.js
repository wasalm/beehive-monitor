module.exports = {
    serial: {
        // path: "/dev/tty.usbserial-1420",
        path: "/dev/ttyUSB0",
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

    hives: {
        general: "qgbutbmtj15b4yc0",
        kast1: "f6zdkdmnfqsflmmp",
        kast2: "zvbe6xt2udnzud0f",
        kast3: "cw6vdsafrzs0kwxc"
    },

    pinMap: {
        "temperature_1": "general",
        "relative_humidity_1": "general",
        "barometric_pressure_1": "general",

        "temperature_2": "kast1",
        "analog_output_10": "kast1",

        "temperature_3": "kast2",
        "analog_output_12": "kast2",

        "temperature_4": "kast3",
        "analog_output_5": "kast3",

        "analog_input_20": "kast1",
        "analog_input_21": "kast1",
        "analog_input_22": "kast1",
        "analog_input_23": "kast1",
        "analog_input_24": "kast1",
        "analog_input_25": "kast1",
        "analog_input_26": "kast1",
        "analog_input_27": "kast1",
        "analog_input_28": "kast1",
        "analog_input_29": "kast1",
        "analog_input_30": "kast1"
    }
}