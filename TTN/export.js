
// For more info, see the Steinhart equation (https://en.wikipedia.org/wiki/Steinhart%E2%80%93Hart_equation)

let src = require("./data.js");

/*
 * Step 1: decode the raw data. De payload decoder from TTN does not contain the raw values.
 */
let decoded = [];
for(let i=0; i<src.length; i++)
{
	let buffer = Buffer.from(src[i].raw, 'base64');
	decoded.push(Decoder(buffer, 1));
	decoded[i].time = src[i].time;
}

/*
 * We want to check against the model 
 *     y_i = A + B x_i
 * where y_i is the inverse of the DHT11 temperature in Kelvin
 * and x_i = log(t_i / (1024 - t_i))
 * We add these values to the objects
 */

let converted = [];
for(let i=0; i<decoded.length; i++) {
	if(typeof decoded[i].t != "undefined" && typeof decoded[i].t_i != "undefined") {
		converted.push({
			time: (decoded[i].time.substr(11,2) + decoded[i].time.substr(14,2))*1,
			t: decoded[i].t,
			f: 1/(273.15 + decoded[i].t),
			w: decoded[i].w_v
		});
	}
}

let result = "time;t;f;w\n";
for(let i=0; i<converted.length; i++) {
	result += converted[i].time + ";" + converted[i].t + ";" + converted[i].f + ";" + converted[i].w + "\n";
}

console.log(result.split(".").join(","))
// console.log(src); //time
// console.log(decoded);
// console.log(converted);
/*
 * Functions
 */

function Decoder(bytes, port) {
	var decoded = {};

	if(bytes[0] != 0 || bytes[1] != 0 || bytes[2] != 0 || bytes[3] != 0) {
		decoded.h = bytes[0] + (bytes[1] * 0.1);
		decoded.t = bytes[2] + (bytes[3] * 0.1);
		
		if(bytes[2] & 0x80) { // Negative temperature
  			decoded.t *= -1;
  		}
	}

	if(bytes[4] != 0 || bytes[5] != 0 || bytes[6] != 0) {
		decoded.w_v = (bytes[6] << 16) | (bytes[5] << 8) | bytes[4];
	}

	if(bytes[7] != 0 || bytes[8] != 0 ) {
		decoded.t_i = (bytes[8] << 8) | bytes[7];
	} 

  return decoded;
}

