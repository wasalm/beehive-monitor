console.log("TEST");

// Sending Message #7: 1C 0 1B 4 3B B B4 1 E2 0

​let msg = new Uint8Array(10);
msg[0] = 0x1C;
msg[1] = 0x00;
msg[2] = 0x1B;
msg[3] = 0x04;
msg[4] = 0x3B;
msg[5] = 0x0B;
msg[6] = 0xB4;
msg[7] = 0x01;
msg[8] = 0xE2;
msg[9] = 0x00;

console.log(msg);


function Decoder(bytes, port) {
  // Decode an uplink message from a buffer
  // (array) of bytes to an object of fields.
  var decoded = {};

  // if (port === 1) decoded.led = bytes[0];

  return decoded;
}

console.log(Decoder)