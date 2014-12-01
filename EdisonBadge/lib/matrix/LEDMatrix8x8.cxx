#include "LEDMatrix8x8.h"

LEDMatrix8x8::LEDMatrix8x8(int bus, int devAddr){
    m_i2cAddr = devAddr;
    m_bus = bus;
    m_i2c = new mraa::I2c(m_bus);
}

LEDMatrix8x8::~LEDMatrix8x8(){
    delete m_i2c;
}

void LEDMatrix8x8::init(){
    char tempBuffer[64];
    uint8_t counter = 0;
    m_i2c->address(0x50);
    tempBuffer[counter++] = 0x80;
    tempBuffer[counter++] = 0x00;
    tempBuffer[counter++] = 0x05;
    for (int i = 0; i < 16; i++) {
        tempBuffer[counter++] = 0xFF; // PWM0-15
    }
    tempBuffer[counter++] = 0xFF;   // GRPPWM
    tempBuffer[counter++] = 0x00;   // GRPFREQ
    m_i2c->write(tempBuffer, counter);
    clear();
}

void LEDMatrix8x8::setBrightness(uint8_t b){
    char tempBuffer[17];
    uint8_t counter = 0;
    m_i2c->address(0x50);
    tempBuffer[counter++] = 0x82;   ///Access to PWM
    for (int i = 0; i < 16; i++) {
        tempBuffer[counter++] = b;
    }
    m_i2c->write(tempBuffer, counter);
}

void LEDMatrix8x8::setDot(uint8_t x, uint8_t y, uint8_t value){
    if(value == 0) {
        displayBuffer[y] &= ~(0x01 << 7 - x);
    } else {
        displayBuffer[y] |= 0x01 << 7 - x;
    }
}

void LEDMatrix8x8::writeDisplay(void){
    char tempBuffer[5];
    uint8_t counter;
    for(int x = 0;x < 8;x++){
        counter = 0;

        m_i2c->address(0x50);
        tempBuffer[counter++] = 0x94;
        if(x < 4) {
            tempBuffer[counter++] = 0x01 << x * 2;
            tempBuffer[counter++] = 0x00;
        } else {
            tempBuffer[counter++] = 0x00;
            tempBuffer[counter++] = 0x01 << x * 2 - 8;
        }
        //Row control
        tempBuffer[counter++] = 0x01 & (displayBuffer[x] >> 0) | (0x01 & (displayBuffer[x] >> 1)) << 2 | (0x01 & (displayBuffer[x] >> 2)) << 4 | (0x01 & (displayBuffer[x]) >> 3) << 6;
        tempBuffer[counter++] = 0x01 & (displayBuffer[x] >> 4) | (0x01 & (displayBuffer[x] >> 5)) << 2 | (0x01 & (displayBuffer[x] >> 6)) << 4 | (0x01 & (displayBuffer[x]) >> 7) << 6;
        m_i2c->write(tempBuffer, 5);
        usleep(500);
    }
}


void LEDMatrix8x8::clear(void){
    for(int i = 0;i < 8;i++){
        displayBuffer[i] = 0;
    }
}

void LEDMatrix8x8::drawBmp(uint8_t *bmp){
    for(int i = 0;i < 8;i++){
        displayBuffer[i] = bmp[i];
    }
}

void LEDMatrix8x8::setDisplayBuffer(uint8_t value, uint8_t row){
    if(row >= 8) row = 7;
    displayBuffer[row] = value;
}

uint8_t LEDMatrix8x8::getDisplayBuffer(uint8_t row){
    if(row >= 8) row = 7;
    return displayBuffer[row];
}
