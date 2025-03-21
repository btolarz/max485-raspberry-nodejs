const ModbusRTU = require('./build/Release/modbus.node');

async function testModbus() {
    try {
        // Create Modbus device instance
        // Parameters: serial port, baud rate, DE pin, RE pin
        const device = ModbusRTU.NewModbusDevice("/dev/serial0", 9600, 17, 27);
        
        if (!device) {
            throw new Error("Failed to create Modbus device");
        }
        
        console.log("Connected to Modbus device");

        try {
            // ===== COILS TEST =====
            console.log("\n=== Testing Coils ===");
            
            // Test reading coils
            console.log("\nReading coils (0-3):");
            const coils = ModbusRTU.ReadCoils(device, 21, 0, 4);
            console.log("Raw data:", coils);
            if (typeof coils === 'string' && coils.startsWith("Error:")) {
                throw new Error(coils.substring(6));
            }
            console.log("Coils:", JSON.parse(coils));

            // Test writing single coil
            console.log("\nWriting coil 0:");
            const writeCoilResult = ModbusRTU.WriteCoil(device, 21, 0, true);
            if (typeof writeCoilResult === 'string' && writeCoilResult.startsWith("Error:")) {
                throw new Error(writeCoilResult.substring(6));
            }
            console.log("Coil 0 written");

            // Read coils state after write
            console.log("\nChecking coils state after write:");
            const coilsAfterWrite = ModbusRTU.ReadCoils(device, 21, 0, 4);
            console.log("Raw data:", coilsAfterWrite);
            if (typeof coilsAfterWrite === 'string' && coilsAfterWrite.startsWith("Error:")) {
                throw new Error(coilsAfterWrite.substring(6));
            }
            console.log("Coils after write:", JSON.parse(coilsAfterWrite));

            // Test writing multiple coils
            console.log("\nWriting multiple coils (0-3):");
            const writeCoilsResult = ModbusRTU.WriteMultipleCoils(device, 21, 0, [true, false, true, false]);
            if (typeof writeCoilsResult === 'string' && writeCoilsResult.startsWith("Error:")) {
                throw new Error(writeCoilsResult.substring(6));
            }
            console.log("Multiple coils written");

            // Read coils state after multiple write
            console.log("\nChecking coils state after multiple write:");
            const coilsAfterMultiWrite = ModbusRTU.ReadCoils(device, 21, 0, 4);
            console.log("Raw data:", coilsAfterMultiWrite);
            if (typeof coilsAfterMultiWrite === 'string' && coilsAfterMultiWrite.startsWith("Error:")) {
                throw new Error(coilsAfterMultiWrite.substring(6));
            }
            console.log("Coils after multiple write:", JSON.parse(coilsAfterMultiWrite));

            // ===== REGISTERS TEST =====
            console.log("\n=== Testing Registers ===");
            
            // Test reading registers
            console.log("\nReading registers (0-3):");
            const registers = ModbusRTU.ReadHoldingRegisters(device, 21, 0, 4);
            console.log("Raw data:", registers);
            if (typeof registers === 'string' && registers.startsWith("Error:")) {
                throw new Error(registers.substring(6));
            }
            console.log("Registers:", JSON.parse(registers));

            // Test writing single register
            console.log("\nWriting register 0 (value 123):");
            const writeRegisterResult = ModbusRTU.WriteRegister(device, 21, 0, 123);
            if (typeof writeRegisterResult === 'string' && writeRegisterResult.startsWith("Error:")) {
                throw new Error(writeRegisterResult.substring(6));
            }
            console.log("Register 0 written");

            // Read registers state after write
            console.log("\nChecking registers state after write:");
            const registersAfterWrite = ModbusRTU.ReadHoldingRegisters(device, 21, 0, 4);
            console.log("Raw data:", registersAfterWrite);
            if (typeof registersAfterWrite === 'string' && registersAfterWrite.startsWith("Error:")) {
                throw new Error(registersAfterWrite.substring(6));
            }
            console.log("Registers after write:", JSON.parse(registersAfterWrite));

            // Test writing multiple registers
            console.log("\nWriting multiple registers (0-3):");
            const writeRegistersResult = ModbusRTU.WriteMultipleRegisters(device, 21, 0, [50, 100, 150, 200]);
            if (typeof writeRegistersResult === 'string' && writeRegistersResult.startsWith("Error:")) {
                throw new Error(writeRegistersResult.substring(6));
            }
            console.log("Multiple registers written");

            // Read registers state after multiple write
            console.log("\nChecking registers state after multiple write:");
            const registersAfterMultiWrite = ModbusRTU.ReadHoldingRegisters(device, 21, 0, 4);
            console.log("Raw data:", registersAfterMultiWrite);
            if (typeof registersAfterMultiWrite === 'string' && registersAfterMultiWrite.startsWith("Error:")) {
                throw new Error(registersAfterMultiWrite.substring(6));
            }
            console.log("Registers after multiple write:", JSON.parse(registersAfterMultiWrite));

        } finally {
            // Close connection
            if (device) {
                ModbusRTU.Close(device);
                console.log("\nConnection closed");
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

testModbus(); 