# max485-raspberry-nodejs

A simple and reliable Modbus RTU library for Node.js using **SerialPort** and **Raspberry Pi GPIO** with **MAX485 RS485 transceivers**.

## Installation

```sh
npm install max485-raspberry-nodejs
```

## Usage

```js
const ModbusRTU = require("max485-raspberry-nodejs");

const client = new ModbusRTU({ path: "/dev/ttyAMA0", baudRate: 9600, re: 27, de: 17 });

(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));

    await client.write(1, 1, 1);

    const value = await client.read(1, 1);
    console.log(`Register value: ${value}`);
})();
```

## Features

	•	Supports Modbus RTU communication over RS485
	•	Handles TX/RX switching for MAX485 chips
	•	Implements retry logic to handle timeouts and bad responses
	•	CRC validation for error detection
	•	Optimized for Raspberry Pi GPIO control

## License

---

MIT