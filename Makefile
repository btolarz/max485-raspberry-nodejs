# Project name
PROJECT_NAME=modbus

# Paths
GO_PATH=/usr/local/go/bin/go
GO=$(shell which go || echo $(GO_PATH))
GOBUILD=$(GO) build
GOTEST=$(GO) test
GOGET=$(GO) get
GOCLEAN=$(GO) clean

# Go version
GO_VERSION=1.21.0
GO_ARCH=arm64
GO_OS=linux

# Node.js paths
NODE_ROOT=$(shell dirname $$(dirname $$(which node)))
NODE_INCLUDE=$(NODE_ROOT)/include/node
NODE_ADDON_API=$(shell npm root -g)/node-addon-api
NODE_LIB=$(NODE_ROOT)/lib

# Build flags
LDFLAGS=-ldflags "-s -w"
CGO_FLAGS=CGO_ENABLED=1 CGO_CFLAGS="-I$(NODE_INCLUDE) -I$(NODE_ADDON_API)" CGO_LDFLAGS="-L$(NODE_LIB) -lnode"

# Check if Go is installed
check-go:
	@if [ ! -f "$(GO)" ]; then \
		echo "Error: Go is not installed. Please run 'sudo make install-go' first"; \
		exit 1; \
	fi

# Check if running on Raspberry Pi
check-raspberry:
	@if ! uname -m | grep -q "aarch64\|armv7l"; then \
		echo "Error: This Makefile is designed for Raspberry Pi (ARM architecture)"; \
		exit 1; \
	fi

# Check if running with sudo
check-sudo:
	@if [ "$(shell id -u)" != "0" ]; then \
		echo "Error: This command requires sudo privileges"; \
		exit 1; \
	fi

# Default target
all: check-raspberry check-go deps binary

# Build target
build: check-raspberry check-go deps binary

# Install Go
install-go: check-raspberry check-sudo
	@echo "Installing Go $(GO_VERSION)..."
	@if [ ! -f "go$(GO_VERSION).$(GO_OS)-$(GO_ARCH).tar.gz" ]; then \
		wget https://golang.org/dl/go$(GO_VERSION).$(GO_OS)-$(GO_ARCH).tar.gz; \
	fi
	sudo tar -C /usr/local -xzf go$(GO_VERSION).$(GO_OS)-$(GO_ARCH).tar.gz
	@if ! grep -q "export PATH=\$PATH:/usr/local/go/bin" ~/.bashrc; then \
		echo 'export PATH=$$PATH:/usr/local/go/bin' >> ~/.bashrc; \
		echo "Added Go to PATH in ~/.bashrc"; \
	fi
	@echo "Go installation completed. Please run 'source ~/.bashrc' to update PATH"

# Install system dependencies
install-deps: check-raspberry check-sudo
	@echo "Installing system dependencies..."
	sudo apt-get update
	sudo apt-get install -y gcc g++ make git libnode-dev npm
	sudo npm install -g node-addon-api

# Install dependencies
deps: check-raspberry check-go
	@echo "Installing Go dependencies..."
	cd go && $(GO) mod download
	cd go && $(GO) mod tidy

# Build as shared library
so: check-raspberry check-go deps
	@echo "Building as shared library..."
	cd go && $(CGO_FLAGS) $(GOBUILD) -buildmode=c-shared -o ../lib$(PROJECT_NAME).so $(LDFLAGS)

# Build as binary executable
binary: check-raspberry check-go deps
	@echo "Building as binary executable..."
	cd go && $(CGO_FLAGS) $(GOBUILD) -o ../$(PROJECT_NAME) $(LDFLAGS)

# Build for Raspberry Pi
raspberry: check-raspberry check-go deps
	@echo "Building for Raspberry Pi..."
	cd go && GOOS=linux GOARCH=arm64 $(GOBUILD) -o ../$(PROJECT_NAME)_raspberry $(LDFLAGS)

# Clean build files
clean:
	@echo "Cleaning..."
	cd go && $(GOCLEAN)
	rm -f $(PROJECT_NAME) $(PROJECT_NAME)_raspberry lib$(PROJECT_NAME).so
	rm -f go$(GO_VERSION).$(GO_OS)-$(GO_ARCH).tar.gz

# Run tests
test: check-raspberry check-go
	@echo "Running tests..."
	cd go && $(GOTEST) -v ./...

# Show help
help:
	@echo "Available commands:"
	@echo "  make install-deps  - Install system dependencies (requires sudo)"
	@echo "  make install-go    - Install Go and configure PATH (requires sudo)"
	@echo "  make all          - Install dependencies and build as binary"
	@echo "  make build        - Build the project"
	@echo "  make deps         - Install Go dependencies"
	@echo "  make so           - Build as shared library"
	@echo "  make binary       - Build as binary executable"
	@echo "  make raspberry    - Build for Raspberry Pi"
	@echo "  make clean        - Clean build files"
	@echo "  make test         - Run tests"
	@echo "  make help         - Show this help"

.PHONY: all build deps so binary raspberry clean test help install-go install-deps check-raspberry check-sudo check-go 