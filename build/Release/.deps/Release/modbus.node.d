cmd_Release/modbus.node := ln -f "Release/obj.target/modbus.node" "Release/modbus.node" 2>/dev/null || (rm -rf "Release/modbus.node" && cp -af "Release/obj.target/modbus.node" "Release/modbus.node")
