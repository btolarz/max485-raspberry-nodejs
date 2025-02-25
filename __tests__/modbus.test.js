const { mockDeep } = require('jest-mock-extended');
const ffi = require('ffi-napi');

jest.mock('ffi-napi');

const ModbusLibraryMock = mockDeep();
ffi.Library.mockReturnValue(ModbusLibraryMock);

const Modbus = require('../index');

describe('Max485RaspberryNodejs', () => {
    let modbus;

    beforeEach(() => {
        modbus = new Modbus({
            port: '/dev/ttyAMA0',
            baudrate: 9600,
            de_pin: 17,
            re_pin: 27
        });

        ModbusLibraryMock.modbus_rtu_read_c.mockClear();
        ModbusLibraryMock.modbus_rtu_write_c.mockClear();
    });

    test('should successfully read a register', async () => {
        ModbusLibraryMock.modbus_rtu_read_c.mockReturnValue(123);

        const result = await modbus.read(1, 2);

        expect(ModbusLibraryMock.modbus_rtu_read_c).toHaveBeenCalledWith('/dev/ttyAMA0', 9600, 17, 27, 1, 2);
        expect(result).toBe(123);
    });

    test('should fail reading a register with error', async () => {
        ModbusLibraryMock.modbus_rtu_read_c.mockReturnValue(-1);

        await expect(modbus.read(1, 2)).rejects.toThrow('Modbus read failed with error code: -1');
        expect(ModbusLibraryMock.modbus_rtu_read_c).toHaveBeenCalledWith('/dev/ttyAMA0', 9600, 17, 27, 1, 2);
    });

    test('should successfully write to a register', async () => {
        ModbusLibraryMock.modbus_rtu_write_c.mockReturnValue(0);

        await expect(modbus.write(1, 2, 42)).resolves.not.toThrow();

        expect(ModbusLibraryMock.modbus_rtu_write_c).toHaveBeenCalledWith('/dev/ttyAMA0', 9600, 17, 27, 1, 2, 42);
    });

    test('should fail writing to a register with error', async () => {
        ModbusLibraryMock.modbus_rtu_write_c.mockReturnValue(-1);

        await expect(modbus.write(1, 2, 42)).rejects.toThrow('Modbus write failed with error code: -1');

        expect(ModbusLibraryMock.modbus_rtu_write_c).toHaveBeenCalledWith('/dev/ttyAMA0', 9600, 17, 27, 1, 2, 42);
    });
});