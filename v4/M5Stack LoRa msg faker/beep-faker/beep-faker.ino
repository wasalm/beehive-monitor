#include <CayenneLPP.h>
#include <M5Stack.h>
#include <LoRaWan.h>

//LoRa
char buffer[256];
//unsigned char payload[9];
long sentMillis = 0;
long currentMillis = 0;
long interval = 15000;

CayenneLPP lpp(51);

void setup() {
  /* Prepare M5STACK */
  M5.begin();

  initlora();

  Serial.println("Started");
}

void loop() {
  if (M5.BtnA.read()) {
    Serial.println("Btn A pressed");
    sendobject1();
  }

  if (M5.BtnB.read()) {
    Serial.println("Btn B pressed");
    sendobject2();
  }

    if (M5.BtnC.read()) {
    Serial.println("Btn C pressed");
    sendobject3();
  }


  M5.update();
}

void initlora() {

  lora.init();

  delay(1000);

  memset(buffer, 0, 256);
  lora.getVersion(buffer, 256, 1);
  Serial.print(buffer);

  memset(buffer, 0, 256);
  lora.getId(buffer, 256, 1);
  Serial.print(buffer);

  // void setId(char *DevAddr, char *DevEUI, char *AppEUI);
  lora.setId("00011500", NULL, NULL);
  //   setKey(char *NwkSKey, char *AppSKey, char *AppKey);
  lora.setKey("5D77C37101E7FDAC9C6D43397C164C05", "5C9354F9DACF6E62C051D7560F8E70F4", NULL);

  lora.setDeviceMode(LWABP);
  lora.setDataRate(DR3, EU868);

  lora.setChannel(0, 868.1);
  lora.setChannel(1, 868.3);
  lora.setChannel(2, 868.5);
  lora.setChannel(3, 867.1);
  lora.setChannel(4, 867.3);
  lora.setChannel(5, 867.5);
  lora.setChannel(6, 867.7);
  lora.setChannel(7, 867.9);

  lora.setReceiveWindowFirst(0, 868.1);
  lora.setReceiveWindowSecond(869.525, DR3);

  lora.setPower(20);
  lora.setPort(1);
  lora.setAdaptiveDataRate(false);
}

void sendobject1() {
  bool result = false;

  sentMillis = millis();

  Serial.println("Sending");

  lpp.reset();
  lpp.addTemperature(1, 22.6);
  lpp.addTemperature(2, 22.5);
  lpp.addTemperature(3, 35.4);
  lpp.addTemperature(4, 35.5);

  lpp.addAnalogOutput(5, 198.35);
  lpp.addAnalogOutput(10, 196.57);
  lpp.addAnalogOutput(12, 186.57);
  
  result = lora.transferPacket(lpp.getBuffer(), lpp.getSize(), 5);


  if (result == true) {
    Serial.println("Sent");

  } else {
    Serial.println("Error");
  }
  delay(5000);
}

void sendobject2() {
  bool result = false;

  sentMillis = millis();

  Serial.println("Sending");

  lpp.reset();

  lpp.addAnalogInput(20, 35.54);
  lpp.addAnalogInput(21, 17.49);
  lpp.addAnalogInput(22, 21.38);
  lpp.addAnalogInput(23, 17.07);
  lpp.addAnalogInput(24, 19.74);
  lpp.addAnalogInput(25, 17.66);
  lpp.addAnalogInput(26, 18.84);
  lpp.addAnalogInput(27, 17.8);
  lpp.addAnalogInput(28, 19.25);
  lpp.addAnalogInput(29, 17.13);
  lpp.addAnalogInput(30, 18.68);
  
  
  result = lora.transferPacket(lpp.getBuffer(), lpp.getSize(), 5);


  if (result == true) {
    Serial.println("Sent");

  } else {
    Serial.println("Error");
  }
  delay(5000);
}


void sendobject3() {
  bool result = false;

  sentMillis = millis();

  Serial.println("Sending");

  lpp.reset();

  lpp.addAnalogInput(1, 1.1);
  lpp.addAnalogOutput(2, 2.2);
  lpp.addTemperature(3, 35.4);
  lpp.addRelativeHumidity(4, 50);
  lpp.addBarometricPressure(5, 1000);
  
  result = lora.transferPacket(lpp.getBuffer(), lpp.getSize(), 5);


  if (result == true) {
    Serial.println("Sent");

  } else {
    Serial.println("Error");
  }
  delay(5000);
}
