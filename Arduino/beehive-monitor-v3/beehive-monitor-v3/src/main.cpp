#include <Arduino.h>
#include <pb_arduino.h>
#include "messages.pb.h"

void setup() {
  Serial.begin(115200);
  // put your setup code here, to run once:

  Response response = Response_init_default;
  response.type.resetResponse.dummy_field = 0;
  response.which_type = Response_resetResponse_tag;
  pb_ostream_s pb_out = as_pb_ostream(Serial);
  bool status = pb_encode(&pb_out, Response_fields, &response);
  
  /* Then just check for any errors.. */
  // if (!status) {
      // return ;
  // }

   
}

void loop() {
  // put your main code here, to run repeatedly:
}