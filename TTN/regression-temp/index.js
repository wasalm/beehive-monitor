console.log("Regression NTC");

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
			y: 1/(273.15 + decoded[i].t),
			x: Math.log(decoded[i].t_i/ (1024 - decoded[i].t_i))
		});
	}
}

/*
 * Let E = \sum (y_i - A - B x_i)^2
 * then \del E / \del A = -2 \sum (y_i - A - B x_i)
 * and  \del E / \del B = -2 \sum (y_i - A - B x_i) x_i
 * 
 * Setting the derivatives at zero, we have
 * \sum (y_i - A - B x_i) = 0
 * \sum (y_i - A - B x_i) x_i = 0
 *
 * Let y = \sum y_i, x = \sum x_i, and x2 = \sum x_i^2, xy = \sum y_i x_i
 * Then we have the system of equations
 *
 *
 * (n) A + (x)  B = y
 * (x) A + (x2) B = xy
 *
 * (1) A + (x/n)  B = y/n
 * (1) A + (x2/x) B = xy/x
 *
 * (n) A + (x) B = y
 * (0) A + (x2/x - x/n) B = (xy/x - y/n)
 *
 * B = (xy/x - y/n)/(x2/x - x/n)
 * A = y/n - (x/n) B 
 */

let n = 0;
let x = 0;
let y = 0;
let x2 = 0;
let xy = 0;

for(let i=0; i<converted.length; i++) {
	n += 1;
	x += converted[i].x;
	y += converted[i].y;
	x2 += converted[i].x * converted[i].x;
	xy += converted[i].x * converted[i].y;
}

let B = ((xy/x) - (y/n))/ ((x2/x)-(x/n));
let A = (y/n) - (x/n) * B;
let E = 0;

for(let i=0; i<converted.length; i++) {
	E += (converted[i].y - A - B * converted[i].x) * (converted[i].y - A - B * converted[i].x);
}


console.log(decoded);
console.log(converted);
console.log("n: " + n + " x: " + x + " y: " + y + " x2: " + x2 + " xy: " + xy);
console.log("A: " + A + " B: " + B + " E: " + E + " sigma:" + Math.sqrt(E)/(n-1));

/*
 * Functions
 */
function base64ToArrayBuffer(base64) {
    var binary_string = atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

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
		decoded.w = (bytes[6] << 16) | (bytes[5] << 8) | bytes[4];
	}

	if(bytes[7] != 0 || bytes[8] != 0 ) {
		decoded.t_i = (bytes[8] << 8) | bytes[7];
	} 

  return decoded;
}

