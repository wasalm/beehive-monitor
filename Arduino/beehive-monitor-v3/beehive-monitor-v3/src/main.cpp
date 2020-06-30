#include <Arduino.h>
#include <avr/wdt.h>
#include <pb_arduino.h>
#include <cobs/Stream.h>
#include <cobs/Print.h>
#include "messages.pb.h"

using namespace packetio;

COBSStream cobs_in(Serial);

COBSPrint cobs_out(Serial);
pb_ostream_s pb_out = as_pb_ostream(cobs_out);

void setup()
{
  Serial.begin(115200);
  // put your setup code here, to run once:

  Response response = Response_init_default;
  response.type.resetResponse.dummy_field = 0;
  response.which_type = Response_resetResponse_tag;
  pb_encode(&pb_out, Response_fields, &response);
  cobs_out.end();
  cobs_in.next();
}

void loop()
{
  uint8_t buffer[255];
  size_t n = 0;

  while (true)
  {
    // read until we get something
    int c = cobs_in.read();
    if (c == -1) // End of file
      continue;

    // detect End Of Packet
    if (c == -2)
      break;

    // save anything else
    buffer[n++] = c;

    if (n == 255)
      break;
  }

  Request request = Request_init_zero;
  Response response = Response_init_default;
  response.which_type = Response_errorResponse_tag; // Default we want an error message

  pb_istream_t pb_in = pb_istream_from_buffer(buffer, n);
  bool status = pb_decode(&pb_in, Request_fields, &request);

  /* Check for errors... */
  if (!status)
  {
    // cobs_out.println(PB_GET_ERROR(&pb_in));
    // cobs_out.end();

    //TODO ERROR STRING
  }
  else
  {
    switch (request.which_type)
    {
    case Request_resetRequest_tag:
      // Reset device
      wdt_enable(WDTO_15MS); // Enable watchdog
      while (1)
      {};
      break;

    default:
      //TODO ERROR STRING
      break;
    }

    // ResetRequest resetRequest = 1;
    // ConfigureRequest configureRequest = 2;
    // BME280Request bme280Request = 3;
    // HX711Request hx711Request = 4;
    // DS18B20Request dS18B20Request = 5;
    // SSD1315Request ssd1315Request = 6;
  }

  // start reading the next message
  pb_encode(&pb_out, Response_fields, &response);
  cobs_out.end();
  cobs_in.next();
}