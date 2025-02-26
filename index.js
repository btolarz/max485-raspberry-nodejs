const ffi = require('ffi-napi');

const libPath = path.join(__dirname, 'libmodbus_rtu.so');

const ModbusLibrary = ffi.Library(libPath, {
  'modbus_rtu_read_c': ['int', ['string', 'int', 'int', 'int', 'int', 'int']],
  'modbus_rtu_write_c': ['int', ['string', 'int', 'int', 'int', 'int', 'int', 'int']]
});

class Max485RaspberryNodejs {
  constructor({ port = '/dev/ttyAMA0', baudrate = 9600, de_pin, re_pin }) {
    this.port = port;
    this.baudrate = baudrate;
    this.de_pin = de_pin;
    this.re_pin = re_pin;
  }

  read(slave_id, register_id) {
    return new Promise((resolve, reject) => {
      const result = ModbusLibrary.modbus_rtu_read_c(this.port, this.baudrate, this.de_pin, this.re_pin, slave_id, register_id);
      if (result < 0) {
        reject(new Error(`Modbus read failed with error code: ${result}`));
      } else {
        resolve(result);
      }
    });
  }

  write(slave_id, register_id, value) {
    return new Promise((resolve, reject) => {
      const result = ModbusLibrary.modbus_rtu_write_c(this.port, this.baudrate, this.de_pin, this.re_pin, slave_id, register_id, value);
      if (result < 0) {
        reject(new Error(`Modbus write failed with error code: ${result}`));
      } else {
        resolve(result);
      }
    });
  }
}

module.exports = Max485RaspberryNodejs;