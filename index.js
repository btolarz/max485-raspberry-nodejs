const { NewModbusDevice, ReadCoils, ReadDiscreteInputs, ReadHoldingRegisters, ReadInputRegisters, WriteCoil, WriteRegister, WriteMultipleCoils, WriteMultipleRegisters, Close } = require('./build/Release/modbus');

class ModbusRTU {
    constructor(port, baudRate, dePin, rePin) {
        this.device = NewModbusDevice(port, baudRate, dePin, rePin);
        if (!this.device) {
            throw new Error('Failed to create Modbus device');
        }
    }

    async readCoils(slaveID, startAddr, count) {
        const result = await ReadCoils(this.device, slaveID, startAddr, count);
        if (result.startsWith('Error:')) {
            throw new Error(result);
        }
        return JSON.parse(result);
    }

    async readDiscreteInputs(slaveID, startAddr, count) {
        const result = await ReadDiscreteInputs(this.device, slaveID, startAddr, count);
        if (result.startsWith('Error:')) {
            throw new Error(result);
        }
        return JSON.parse(result);
    }

    async readHoldingRegisters(slaveID, startAddr, count) {
        const result = await ReadHoldingRegisters(this.device, slaveID, startAddr, count);
        if (result.startsWith('Error:')) {
            throw new Error(result);
        }
        return JSON.parse(result);
    }

    async readInputRegisters(slaveID, startAddr, count) {
        const result = await ReadInputRegisters(this.device, slaveID, startAddr, count);
        if (result.startsWith('Error:')) {
            throw new Error(result);
        }
        return JSON.parse(result);
    }

    async writeCoil(slaveID, coilAddr, value) {
        const result = await WriteCoil(this.device, slaveID, coilAddr, value);
        if (result.startsWith('Error:')) {
            throw new Error(result);
        }
        return result;
    }

    async writeRegister(slaveID, regAddr, value) {
        const result = await WriteRegister(this.device, slaveID, regAddr, value);
        if (result.startsWith('Error:')) {
            throw new Error(result);
        }
        return result;
    }

    async writeMultipleCoils(slaveID, startAddr, values) {
        const result = await WriteMultipleCoils(this.device, slaveID, startAddr, values);
        if (result.startsWith('Error:')) {
            throw new Error(result);
        }
        return result;
    }

    async writeMultipleRegisters(slaveID, startAddr, values) {
        const result = await WriteMultipleRegisters(this.device, slaveID, startAddr, values);
        if (result.startsWith('Error:')) {
            throw new Error(result);
        }
        return result;
    }

    close() {
        Close(this.device);
    }
}

module.exports = ModbusRTU; 

