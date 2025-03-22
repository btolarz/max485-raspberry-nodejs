# max485-raspberry-nodejs

Node.js library for Modbus RTU communication over RS485 using MAX485 transceivers on Raspberry Pi.

## Installation

```bash
npm install max485-raspberry-nodejs
```

## Requirements

- Node.js >= 14.0.0
- Linux (tested on Raspberry Pi)
- RS-485 Serial Port

## Usage Example

```javascript
const ModbusRTU = require('max485-raspberry-nodejs');

// Create Modbus device instance
// Parameters:
// - port: serial port path (e.g., '/dev/serial0' or '/dev/ttyUSB0')
// - baudRate: communication speed (e.g., 9600)
// - dePin: GPIO pin number for DE (Driver Enable)
// - rePin: GPIO pin number for RE (Receiver Enable)
const device = new ModbusRTU('/dev/serial0', 9600, 17, 27);

async function example() {
    try {
        // Read coils (function 0x01)
        const coils = await device.readCoils(1, 0, 4);
        console.log('Coils state:', coils);

        // Write single coil (function 0x05)
        await device.writeCoil(1, 0, true);

        // Write multiple coils (function 0x0F)
        await device.writeMultipleCoils(1, 0, [true, false, true, false]);

        // Read holding registers (function 0x03)
        const registers = await device.readHoldingRegisters(1, 0, 4);
        console.log('Registers state:', registers);

        // Write single register (function 0x06)
        await device.writeRegister(1, 0, 123);

        // Write multiple registers (function 0x10)
        await device.writeMultipleRegisters(1, 0, [50, 100, 150, 200]);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        // Close connection
        device.close();
    }
}

example();
```

## API

### Constructor

#### `new ModbusRTU(port, baudRate, dePin, rePin)`

- `port` (string): Serial port path
- `baudRate` (number): Communication speed
- `dePin` (number): GPIO pin number for DE signal
- `rePin` (number): GPIO pin number for RE signal

### Methods

#### Reading Data

- `readCoils(slaveId, startAddr, count)`: Read coils (function 0x01)
- `readDiscreteInputs(slaveId, startAddr, count)`: Read discrete inputs (function 0x02)
- `readHoldingRegisters(slaveId, startAddr, count)`: Read holding registers (function 0x03)
- `readInputRegisters(slaveId, startAddr, count)`: Read input registers (function 0x04)

Parameters:
- `slaveId` (number): Modbus device address (1-247)
- `startAddr` (number): Starting address
- `count` (number): Number of elements to read

Returns: Promise with array of values (boolean for coils/inputs, number for registers)

#### Writing Data

- `writeCoil(slaveId, addr, value)`: Write single coil (function 0x05)
- `writeRegister(slaveId, addr, value)`: Write single register (function 0x06)
- `writeMultipleCoils(slaveId, startAddr, values)`: Write multiple coils (function 0x0F)
- `writeMultipleRegisters(slaveId, startAddr, values)`: Write multiple registers (function 0x10)

Parameters:
- `slaveId` (number): Modbus device address (1-247)
- `addr`/`startAddr` (number): Address to write to
- `value` (boolean/number): Value to write
- `values` (Array): Array of values to write

Returns: Promise

#### Connection Management

- `close()`: Closes the connection to the device

## Error Handling

All methods (except `close()`) return a Promise. In case of an error, the Promise is rejected with an appropriate error message.

## License

MIT 
