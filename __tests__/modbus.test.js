const Modbus = require('../index');
const { SerialPort } = require("serialport");

jest.mock("serialport", () => {
    const mockWrite = jest.fn((buffer, callback) => callback(null));
    const mockDrain = jest.fn(callback => callback(null));
    const mockFlush = jest.fn(callback => callback(null));

    return {
        SerialPort: jest.fn(() => ({
            open: jest.fn(callback => callback(null)),
            write: mockWrite,
            drain: mockDrain,
            flush: mockFlush,
            read: jest.fn(),
            on: jest.fn(),
        })),
    };
});

jest.mock("rpio", () => ({
    init: jest.fn(),
    open: jest.fn(),
    write: jest.fn(),
    msleep: jest.fn(),
}));

describe("Modbus RTU", () => {
    let client;

    beforeAll(() => {
        client = new Modbus({ path: "/dev/ttyAMA0", baudRate: 9600, re: 27, de: 17 });
    });

    test("Should send a valid READ request", async () => {
        const sendRequestMock = jest.spyOn(client, "sendRequest").mockResolvedValue(
            Buffer.from([0x01, 0x03, 0x02, 0x00, 0x7B, 0xF8, 0x67])
        );

        const result = await client.read(1, 1);

        expect(sendRequestMock).toHaveBeenCalled();
        expect(result).toBe(123);
    });

    test("Should send a valid WRITE request", async () => {
        const sendRequestMock = jest.spyOn(client, "sendRequest").mockResolvedValue(
            Buffer.from([0x01, 0x06, 0x00, 0x02, 0x00, 0x01, 0xE9, 0xCA])
        );

        const result = await client.write(1, 2, 1);

        expect(sendRequestMock).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    test("Should handle timeout in READ", async () => {
        const sendRequestMock = jest.spyOn(client, "sendRequest").mockRejectedValue("Timeout: No response from slave.");

        const result = await client.read(1, 1);

        expect(sendRequestMock).toHaveBeenCalled();
        expect(result).toBeNull();
    });

    test("Should handle timeout in WRITE", async () => {
        const sendRequestMock = jest.spyOn(client, "sendRequest").mockRejectedValue("Timeout: No response from slave.");

        const result = await client.write(1, 2, 1);

        expect(sendRequestMock).toHaveBeenCalled();
        expect(result).toBe(false);
    });

    test("Should detect incorrect CRC in READ response", async () => {
        const sendRequestMock = jest.spyOn(client, "sendRequest").mockResolvedValue(
            Buffer.from([0x01, 0x03, 0x02, 0x00, 0x7B, 0xFF, 0xFF]) // Invalid CRC
        );
    
        const result = await client.read(1, 1);
    
        expect(sendRequestMock).toHaveBeenCalled();
        expect(result).toBeNull(); // Now correctly fails when CRC is invalid
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });
});