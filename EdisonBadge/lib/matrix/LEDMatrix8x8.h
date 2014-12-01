#pragma once
#include <unistd.h>
#include <signal.h>
#include <mraa.hpp>

class LEDMatrix8x8 {
    public :
        uint8_t displayBuffer[8];
        LEDMatrix8x8(int bus, int devAddr);
        ~LEDMatrix8x8();
        void init();
        void setBrightness(uint8_t b);
        void setDot(uint8_t x, uint8_t y, uint8_t value);
        void writeDisplay(void);
        void clear(void);
        void drawBmp(uint8_t *bmp);
        void setDisplayBuffer(uint8_t value, uint8_t row);
        uint8_t getDisplayBuffer(uint8_t row);

    private :
        int m_i2cAddr;
        int m_bus;
        mraa::I2c *m_i2c;
};