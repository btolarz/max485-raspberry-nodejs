const ModbusDevice = require('../index.js');
const assert = require('assert');

describe('ModbusDevice', () => {
    let device;

    before(() => {
        // Uwaga: testy wymagają fizycznego urządzenia Modbus
        // Zmień parametry według swojej konfiguracji
        device = new ModbusDevice('/dev/serial0', 9600, 17, 27);
    });

    after(() => {
        if (device) {
            device.close();
        }
    });

    it('powinno odczytać cewki', async () => {
        const coils = await device.readCoils(1, 0, 10);
        assert(Array.isArray(coils), 'readCoils powinno zwrócić tablicę');
        assert(coils.length === 10, 'readCoils powinno zwrócić 10 wartości');
        coils.forEach(coil => {
            assert(typeof coil === 'boolean', 'każda cewka powinna być typu boolean');
        });
    });

    it('powinno odczytać rejestry', async () => {
        const registers = await device.readHoldingRegisters(1, 0, 5);
        assert(Array.isArray(registers), 'readHoldingRegisters powinno zwrócić tablicę');
        assert(registers.length === 5, 'readHoldingRegisters powinno zwrócić 5 wartości');
        registers.forEach(register => {
            assert(typeof register === 'number', 'każdy rejestr powinien być liczbą');
            assert(register >= 0 && register <= 65535, 'wartość rejestru powinna być w zakresie 0-65535');
        });
    });

    it('powinno zapisać i odczytać cewkę', async () => {
        const testValue = true;
        await device.writeCoil(1, 0, testValue);
        const [coil] = await device.readCoils(1, 0, 1);
        assert.strictEqual(coil, testValue, 'odczytana wartość powinna być równa zapisanej');
    });

    it('powinno zapisać i odczytać rejestr', async () => {
        const testValue = 12345;
        await device.writeRegister(1, 0, testValue);
        const [register] = await device.readHoldingRegisters(1, 0, 1);
        assert.strictEqual(register, testValue, 'odczytana wartość powinna być równa zapisanej');
    });
}); 