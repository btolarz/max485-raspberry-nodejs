#ifdef __cplusplus
extern "C" {
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <termios.h>
#include <unistd.h>
#include <stdint.h>
#include <bcm2835.h>

#define MODBUS_BUFFER_SIZE 256

// Modbus Error Codes
enum ModbusErrors {
    MODBUS_SUCCESS = 0,
    MODBUS_CRC_ERROR = -1,
    MODBUS_TIMEOUT_ERROR = -2,
    MODBUS_INVALID_RESPONSE = -3,
    MODBUS_SERIAL_ERROR = -4
};

// 📌 CRC-16 Calculation
uint16_t calculate_crc(uint8_t *buffer, int length) {
    uint16_t crc = 0xFFFF;
    for (int i = 0; i < length; i++) {
        crc ^= buffer[i];
        for (int j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }
    return crc;
}

// 📌 Initialize Serial Port
int init_serial(const char *device, int baudrate) {
    int fd = open(device, O_RDWR | O_NOCTTY | O_NDELAY);
    if (fd == -1) {
        printf("{\"error_code\":\"SERIAL_OPEN_ERROR\",\"message\":\"Failed to open serial port\"}\n");
        return MODBUS_SERIAL_ERROR;
    }

    struct termios options;
    tcgetattr(fd, &options);
    cfsetispeed(&options, baudrate);
    cfsetospeed(&options, baudrate);
    options.c_cflag = CS8 | CLOCAL | CREAD;
    options.c_iflag = IGNPAR;
    options.c_oflag = 0;
    options.c_lflag = 0;
    tcflush(fd, TCIFLUSH);
    tcsetattr(fd, TCSANOW, &options);
    return fd;
}

// 📌 Enable Transmit Mode
void enable_tx(int de_pin, int re_pin) {
    bcm2835_gpio_write(de_pin, HIGH);
    bcm2835_gpio_write(re_pin, HIGH);
    usleep(5000);
}

// 📌 Enable Receive Mode
void enable_rx(int de_pin, int re_pin) {
    bcm2835_gpio_write(de_pin, LOW);
    bcm2835_gpio_write(re_pin, LOW);
    usleep(5000);
}

// 📌 Send Modbus Request and Receive Response
int send_modbus_request(int fd, uint8_t *request, int req_length, uint8_t *response, int expected_length, int de_pin, int re_pin) {
    enable_tx(de_pin, re_pin);
    write(fd, request, req_length);
    tcdrain(fd);
    enable_rx(de_pin, re_pin);

    fd_set set;
    struct timeval timeout;
    FD_ZERO(&set);
    FD_SET(fd, &set);
    timeout.tv_sec = 0;
    timeout.tv_usec = 400000;

    if (select(fd + 1, &set, NULL, NULL, &timeout) <= 0) {
        printf("{\"error_code\":\"MODBUS_TIMEOUT_ERROR\",\"message\":\"No response from slave\"}\n");
        return MODBUS_TIMEOUT_ERROR;
    }

    int len = read(fd, response, expected_length);
    if (len < expected_length) {
        printf("{\"error_code\":\"MODBUS_INVALID_RESPONSE\",\"message\":\"Received incomplete response\"}\n");
        return MODBUS_INVALID_RESPONSE;
    }

    uint16_t expected_crc = calculate_crc(response, len - 2);
    uint16_t received_crc = (response[len - 1] << 8) | response[len - 2];

    if (expected_crc != received_crc) {
        printf("{\"error_code\":\"MODBUS_CRC_ERROR\",\"message\":\"CRC mismatch\"}\n");
        return MODBUS_CRC_ERROR;
    }

    return MODBUS_SUCCESS;
}

// 📌 Read Holding Register
void modbus_rtu_read(int fd, uint8_t slave_id, uint16_t reg, int de_pin, int re_pin) {
    uint8_t request[8] = {slave_id, 0x03, (reg >> 8) & 0xFF, reg & 0xFF, 0x00, 0x01};
    uint16_t crc = calculate_crc(request, 6);
    request[6] = crc & 0xFF;
    request[7] = (crc >> 8) & 0xFF;

    uint8_t response[MODBUS_BUFFER_SIZE];
    int status = send_modbus_request(fd, request, 8, response, 7, de_pin, re_pin);
    if (status == MODBUS_SUCCESS) {
        printf("{\"register\":%d,\"value\":%d,\"status\":\"success\"}\n", reg, (response[3] << 8) | response[4]);
    }
}

// 📌 Write Single Register
void modbus_rtu_write(int fd, uint8_t slave_id, uint16_t reg, uint16_t value, int de_pin, int re_pin) {
    uint8_t request[8] = {slave_id, 0x06, (reg >> 8) & 0xFF, reg & 0xFF, (value >> 8) & 0xFF, value & 0xFF};
    uint16_t crc = calculate_crc(request, 6);
    request[6] = crc & 0xFF;
    request[7] = (crc >> 8) & 0xFF;

    uint8_t response[MODBUS_BUFFER_SIZE];
    int status = send_modbus_request(fd, request, 8, response, 8, de_pin, re_pin);
    if (status == MODBUS_SUCCESS) {
        printf("{\"register\":%d,\"value\":%d,\"status\":\"success\"}\n", reg, value);
    }
}

// 📌 Main Function
int main(int argc, char *argv[]) {
    if (argc < 8) {
        printf("{\"error_code\":\"INVALID_ARGUMENTS\",\"message\":\"Usage: %s <port> <baudrate> <DE_PIN> <RE_PIN> <slave_id> <register> <operation> [value]\"}\n", argv[0]);
        return 1;
    }

    const char *port = argv[1];
    int baudrate = atoi(argv[2]);
    int de_pin = atoi(argv[3]);
    int re_pin = atoi(argv[4]);
    int slave_id = atoi(argv[5]);
    int reg = atoi(argv[6]);
    const char *operation = argv[7];

    int fd = init_serial(port, baudrate);
    if (fd < 0) return 1;

    bcm2835_init();
    bcm2835_gpio_fsel(de_pin, BCM2835_GPIO_FSEL_OUTP);
    bcm2835_gpio_fsel(re_pin, BCM2835_GPIO_FSEL_OUTP);

    if (strcmp(operation, "read") == 0) {
        modbus_rtu_read(fd, slave_id, reg, de_pin, re_pin);
    } else if (strcmp(operation, "write") == 0 && argc == 9) {
        int value = atoi(argv[8]);
        modbus_rtu_write(fd, slave_id, reg, value, de_pin, re_pin);
    } else {
        printf("{\"error_code\":\"INVALID_OPERATION\",\"message\":\"Invalid operation. Use 'read' or 'write'\"}\n");
    }

    close(fd);
    bcm2835_close();
    return 0;
}

__attribute__((visibility("default"))) int modbus_rtu_read_c(const char *port, int baudrate, int de_pin, int re_pin, int slave_id, int reg) {
    int fd = init_serial(port, baudrate);
    if (fd < 0) return MODBUS_SERIAL_ERROR;
    bcm2835_init();
    bcm2835_gpio_fsel(de_pin, BCM2835_GPIO_FSEL_OUTP);
    bcm2835_gpio_fsel(re_pin, BCM2835_GPIO_FSEL_OUTP);
    modbus_rtu_read(fd, slave_id, reg, de_pin, re_pin);
    close(fd);
    bcm2835_close();
    return MODBUS_SUCCESS;
}

__attribute__((visibility("default"))) int modbus_rtu_write_c(const char *port, int baudrate, int de_pin, int re_pin, int slave_id, int reg, int value) {
    int fd = init_serial(port, baudrate);
    if (fd < 0) return MODBUS_SERIAL_ERROR;
    bcm2835_init();
    bcm2835_gpio_fsel(de_pin, BCM2835_GPIO_FSEL_OUTP);
    bcm2835_gpio_fsel(re_pin, BCM2835_GPIO_FSEL_OUTP);
    modbus_rtu_write(fd, slave_id, reg, value, de_pin, re_pin);
    close(fd);
    bcm2835_close();
    return MODBUS_SUCCESS;
}

#ifdef __cplusplus
}
#endif