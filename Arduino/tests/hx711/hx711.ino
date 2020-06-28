
#include "libs/HX711/Hx711.cpp"

#define HX711_PIN_VDD 9
#define HX711_PIN_DAT 8
#define HX711_PIN_CLK 7

unsigned long lastRead = 0;

HX711 scale;

void enableHX711() {
  pinMode(HX711_PIN_VDD, OUTPUT);
  digitalWrite(HX711_PIN_VDD, HIGH);

  scale.begin(HX711_PIN_DAT, HX711_PIN_CLK);
}

void setup()
{
  Serial.begin(115200);

  enableHX711();
  delay(500);
}

void loop()
{
  if (millis() - lastRead > 500)
  {
    lastRead = millis();

    
    if (scale.is_ready()) {
      long reading = scale.read();
      Serial.println(reading);
    } else {
      Serial.println("HX711 not found.");
    }

    //Data is LSB
  }
}

// END OF FILE
