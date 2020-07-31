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