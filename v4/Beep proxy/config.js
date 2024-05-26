module.exports = {

    chirpstack: {
        url: "ssl://service-beep:aUtgZhEfohdTpRHhOuxmHHkMSqwXAKRu@vps.andries-salm.com:8883",
        deviceEUI: "a9f77f39d1b167d6"
    },

    hives: {
        // general: "qgbutbmtj15b4yc0",
        kast1: "f6zdkdmnfqsflmmp",
        kast2: "zvbe6xt2udnzud0f",
        kast3: "cw6vdsafrzs0kwxc"
    },

    virtualPins: {
        // "analog_output_kast_without_temp_compensation": {
        //     offset: -26.47 * 0.23093,
        //     scale: {
        //         "analog_output_10": 0.23093,
        //     }
        // },

        "analog_output_kast_with_temp_compensation": {
            offset: -27.1731945723215 * 0.23093 + 0.85,
            scale: {
                "analog_output_10": 1 * 0.23093,
                // "temperature_1": 0.0296711404345529 * 0.23093, //0.0567086578494735 * 0.23093,
            }
        },

        "analog_output_kast2_with_temp_compensation": {
            offset: -23.624230096609 * 0.224858907701195,
            scale: {
                "analog_output_12": 1 * 0.224858907701195,
                // "temperature_1": -0.0118919207845805 * 0.224858907701195
            }
        },

        "analog_output_kast3_with_temp_compensation": {
            offset: -23.624230096609 * 0.224858907701195,
            scale: {
                "analog_output_5": 1 * 0.224858907701195,
                // "temperature_1": -0.0118919207845805 * 0.224858907701195
            }
        }
    },

    pinMap: {
        "kast1": [
            "temperature_1",
            "relative_humidity_1",
            "barometric_pressure_1",

            "temperature_2",
            // "analog_output_10",
            "analog_output_kast_with_temp_compensation",

            // "analog_input_20", // Ignore total sound
            "analog_input_21",
            "analog_input_22",
            "analog_input_23",
            "analog_input_24",
            "analog_input_25",
            "analog_input_26",
            "analog_input_27",
            "analog_input_28",
            "analog_input_29",
            "analog_input_30"
        ],

        "kast2": [
            "temperature_1",
            "relative_humidity_1",
            "barometric_pressure_1",

            "temperature_3",
            // "analog_output_12",
            "analog_output_kast2_with_temp_compensation"
        ],

        "kast3": [
            "temperature_1",
            "relative_humidity_1",
            "barometric_pressure_1",

            "temperature_4",
            // "analog_output_5"
            "analog_output_kast3_with_temp_compensation"
        ]
    }
}