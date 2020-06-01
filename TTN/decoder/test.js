console.log("TEST");

// Sending Message #1: 20 0 1A 7 2F B7 1 E5 0 43

var msg = new Uint8Array(9);
msg[0] = 0x20;
msg[1] = 0x00;
msg[2] = 0x1A;
msg[3] = 0x07;
msg[4] = 0x2F;
msg[5] = 0xB7;
msg[6] = 0x01;
msg[7] = 0xE5;
msg[8] = 0x00;
msg[9] = 0x43;


var decoded = Decoder(msg,1)
var converted = Converter(decoded,1);

console.log(msg);
console.log(decoded);
console.log(converted);

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

function Converter(decoded, port) {
  var scale = {
  	tare: 112431,
  	oneKg: -20000
  };

  var ntc = {
  	Umax: 1024,
  	Rup: 32200,
  	R25: 10000,
  	T0: 273.15,
  	T25: 298.15,
  	B: 3950
  };

  var converted = {};

  // //DHT11 can be copied directly
  if(typeof decoded.h != "undefined") {
  	converted.h = decoded.h;	
  }

  if(typeof decoded.t != "undefined") {
  	converted.t = decoded.t;	
  }

  if(typeof decoded.w != "undefined") {
    var weight = decoded.w - scale.tare; // Remove zero offset
    weight = weight % (256*256*256); // Values are 24 bit

    if(weight < 0) {
      weight += 256*256*256; // make range between 0 and 256*256*256
    }

    if(weight >= 128*256*256) { // Assume that if value is too large it is actually negative
      weight -= 256*256*256; 
    }
    converted.w = weight/scale.oneKg;
  }

  if(typeof decoded.t_i != "undefined") {
  	var Rntc = ntc.Rup * decoded.t_i / (ntc.Umax - decoded.t_i);
  	var Tinv = 1/ntc.T25 + Math.log(Rntc / ntc.R25)/ntc.B;
  	converted.t_i = (1/Tinv) - ntc.T0;
  }

  return converted;
}