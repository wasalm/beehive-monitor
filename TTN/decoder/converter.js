function Converter(decoded, port) {
  var scale = {
    tare: 109661,
    oneKg: -22413
  };

  //Model is y = 1/T = A + B X where T = temperature in kelvin and x = log(U/(1024-U))
  var ntc = {
    A: 0.0037179478127912814,
    B: 0.0002919694035340662,
  };

  var converted = {};

  // //DHT11 can be copied directly
  if(typeof decoded.h != "undefined") {
    converted.h = decoded.h;  
  }

  if(typeof decoded.t != "undefizned") {
    converted.t = decoded.t;  
  }

  if(typeof decoded.w_v != "undefined") {
    var weight = decoded.w_v - scale.tare; // Remove zero offset
    weight = weight % (256*256*256); // Values are 24 bit

    if(weight < 0) {
      weight += 256*256*256; // make range between 0 and 256*256*256
    }

    if(weight >= 128*256*256) { // Assume that if value is too large it is actually negative
      weight -= 256*256*256; 
    }
    converted.w_v = weight/scale.oneKg;
  }

  if(typeof decoded.t_i != "undefined") {
    var x = Math.log(decoded.t_i/(1024-decoded.t_i));
    var y = ntc.A + ntc.B * x;
    converted.t_i = (1/y) - 273.15;
  }

  return converted;
}