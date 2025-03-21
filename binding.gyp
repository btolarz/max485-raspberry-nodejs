{
  "targets": [{
    "target_name": "modbus",
    "sources": [ "src/binding.cc" ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")"
    ],
    "dependencies": [
      "<!(node -p \"require('node-addon-api').gyp\")"
    ],
    "libraries": ["$(PWD)/libmodbus.so"],
    "cflags!": [ "-fno-exceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ]
  }]
} 