const { SerialPort } = require("serialport");
const rpio = require("rpio");
const crc16 = require("crc").crc16modbus;

class Modbus {
    constructor({ path = "/dev/ttyAMA0", baudRate = 9600, re, de }) {
        this.DE_PIN = de;
        this.RE_PIN = re;

        rpio.init({ mapping: "gpio" });
        rpio.open(this.DE_PIN, rpio.OUTPUT, rpio.LOW);
        rpio.open(this.RE_PIN, rpio.OUTPUT, rpio.LOW);

        this.port = new SerialPort({
            path,
            baudRate,
            parity: "none",
            dataBits: 8,
            stopBits: 1,
            autoOpen: false,
        });

        this.responseBuffer = Buffer.alloc(0);

        this.port.open((err) => {
            if (err) throw new Error(`Port open error: ${err.message}`);
        });

        this.port.on("data", (data) => {
            this.responseBuffer = Buffer.concat([this.responseBuffer, data]);
        });

        this.waitingForResponse = false;
    }

    enableTx() {
        rpio.write(this.DE_PIN, rpio.HIGH);
        rpio.write(this.RE_PIN, rpio.HIGH);
        rpio.msleep(20);
    }

    enableRx() {
        rpio.write(this.DE_PIN, rpio.LOW);
        rpio.write(this.RE_PIN, rpio.LOW);
        rpio.msleep(200);
    }

    async sendRequest(buffer) {
        return new Promise((resolve, reject) => {
            if (this.waitingForResponse) return reject("Previous request still pending.");

            this.waitingForResponse = true;
            this.responseBuffer = Buffer.alloc(0);

            this.port.flush(() => {
                this.enableTx();
                this.port.write(buffer, (err) => {
                    if (err) return reject(`Write error: ${err.message}`);
                    this.port.drain(() => {
                        this.enableRx();
                        setTimeout(() => {
                            if (this.responseBuffer.length > 0) {
                                resolve(this.responseBuffer);
                            } else {
                                reject("Timeout: No response from slave.");
                            }
                        }, 1500);
                    });
                });
            });
        });
    }

    async read(slaveID, registerID) {
        const request = Buffer.alloc(6);
        request.writeUInt8(slaveID, 0);
        request.writeUInt8(0x03, 1);
        request.writeUInt16BE(registerID, 2);
        request.writeUInt16BE(1, 4);

        const crc = crc16(request);
        const requestWithCRC = Buffer.concat([request, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])]);

        try {
            const response = await this.sendRequest(requestWithCRC);
            if (response.length >= 7 && response[0] === slaveID && response[1] === 0x03) {
                const responseData = response.slice(0, response.length - 2);
                const receivedCRC = response.readUInt16LE(response.length - 2);
                const calculatedCRC = crc16(responseData);
            
                if (receivedCRC !== calculatedCRC) {
                    return null;
                }
            
                return response.readUInt16BE(3);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async write(slaveID, registerID, value) {
        const request = Buffer.alloc(6);
        request.writeUInt8(slaveID, 0);
        request.writeUInt8(0x06, 1);
        request.writeUInt16BE(registerID, 2);
        request.writeUInt16BE(value, 4);

        const crc = crc16(request);
        const requestWithCRC = Buffer.concat([request, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])]);

        try {
            const response = await this.sendRequest(requestWithCRC);
            if (response.equals(requestWithCRC)) return true;
            return false;
        } catch (error) {
            return false;
        }
    }
}

module.exports = Modbus;