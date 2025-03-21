package main

import (
	"github.com/stianeikeland/go-rpio/v4"
	"github.com/tarm/serial"
)

// ModbusDevice represents a Modbus RTU device
type ModbusDevice struct {
	port   *serial.Port
	dePin  rpio.Pin
	rePin  rpio.Pin
} 