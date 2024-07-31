#include <Arduino.h>
#include <EEPROM.h>

char randomHex() {
  int val = random(0,16);


  Serial.println(val);
  if(val > 9) {
    return 'a' - 10 + val;
  } else {
    return '0' + val;
  }
}

void setup()
{
  Serial.begin(115200);
  randomSeed(analogRead(0));
  
  Serial.println("Seeduino: Burn Serial Id into EEPROM");

  char serialId[20];

  for(int i =0; i< 6; i++) {
    char val = randomHex();
    serialId[i] = val;
    EEPROM.write(i, val);
  }

  serialId[6] = 0;

  Serial.print("Random Code: ");
  Serial.println((const char*) &serialId);


}

// void getSerialId()
// {
//   Serial.print('S');

//   for (int i = 0; i < 6; i++){
//     Serial.write(EEPROM.read(i));
//   }
  
//   Serial.println();
// }


void loop()
{
  // Nothing to do now
}