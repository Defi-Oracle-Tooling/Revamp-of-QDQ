# Installation Guide

🏠 [Documentation Home](../README.md) → [Docs](../docs/) → [Getting-started](../docs/getting-started/) → **installation**


> **Status:** Active | **Last Updated:** 2025-10-14 | **Version:** 0.4.0

Detailed installation instructions for all supported platforms and environments.

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores (4 cores recommended)
- **RAM**: 4GB (8GB recommended for full networks)
- **Disk**: 10GB free space (50GB+ for production)
- **Network**: Internet connection for initial downloads

### Software Prerequisites

#### Required Software
- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Docker**: Version 20.0.0 or higher
- **Docker Compose**: Version 1.29.0 or higher

#### Optional Software
- **Git**: For cloning repositories and version control
- **Azure CLI**: For Azure deployment features
- **kubectl**: For Kubernetes deployments

## Platform-Specific Installation

### Ubuntu/Debian Linux

#### Install Node.js and npm
```bash
# Method 1: Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Method 2: Using package manager
sudo apt update
sudo apt install nodejs npm

# Verify installation
node --version  # Should be v16.0.0+
npm --version   # Should be 8.0.0+
```

#### Install Docker and Docker Compose
```bash
# Install Docker
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install docker-ce

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group (logout/login required)
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

### CentOS/RHEL/Fedora

#### Install Node.js and npm
```bash
# Enable NodeJS repository
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# Install Node.js
sudo dnf install nodejs npm  # Fedora
sudo yum install nodejs npm  # CentOS/RHEL

# Verify installation
node --version
npm --version
```

#### Install Docker and Docker Compose
```bash
# Install Docker
sudo dnf install dnf-plugins-core  # Fedora
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install docker-ce docker-ce-cli containerd.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### macOS

#### Install Node.js and npm
```bash
# Method 1: Using Homebrew (recommended)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node

# Method 2: Download from nodejs.org
# Visit https://nodejs.org and download the macOS installer

# Verify installation
node --version
npm --version
```

#### Install Docker Desktop
```bash
# Method 1: Using Homebrew
brew install --cask docker

# Method 2: Download Docker Desktop
# Visit https://www.docker.com/products/docker-desktop and download for macOS

# Start Docker Desktop from Applications
# Docker Compose is included with Docker Desktop
```

### Windows

#### Install Node.js and npm
1. Visit [nodejs.org](https://nodejs.org/)
2. Download the Windows Installer (.msi) for LTS version
3. Run the installer with default settings
4. Open Command Prompt or PowerShell and verify:
   ```cmd
   node --version
   npm --version
   ```

#### Install Docker Desktop
1. Visit [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Download and run the installer
3. Enable WSL2 backend when prompted
4. Restart when installation completes
5. Start Docker Desktop from Start menu

#### WSL2 Setup (Recommended)
```powershell
# Enable WSL2 feature
wsl --install

# Set WSL2 as default
wsl --set-default-version 2

# Install Ubuntu from Microsoft Store
# Configure Docker Desktop to use WSL2 backend
```

## Installation Methods

### Method 1: NPX (Recommended for Most Users)
```bash
# No installation required - run directly
npx quorum-dev-quickstart --clientType besu --privacy true

# NPX will automatically download and run the latest version
```

### Method 2: Global NPM Installation
```bash
# Install globally
npm install -g quorum-dev-quickstart

# Run from anywhere
quorum-dev-quickstart --clientType besu --privacy true

# Update to latest version
npm update -g quorum-dev-quickstart
```

### Method 3: Local Development Installation
```bash
# Clone the repository
git clone https://github.com/ConsenSys/quorum-dev-quickstart.git
cd quorum-dev-quickstart

# Install dependencies and build
npm install
npm run build

# Run locally
node build/index.js --clientType besu --privacy true
```

### Method 4: Docker Container (Experimental)
```bash
# Run in Docker container (no local Node.js required)
docker run --rm -it -v $(pwd):/output \
  consensys/quorum-dev-quickstart:latest \
  --clientType besu --privacy true --outputPath /output/my-network
```

## Verification

### Basic Installation Check
```bash
# Check Node.js and npm
node --version    # Should be v16.0.0+
npm --version     # Should be 8.0.0+

# Check Docker
docker --version         # Should be 20.0.0+
docker-compose --version # Should be 1.29.0+

# Test Docker permissions
docker run --rm hello-world

# Test Revamp of QDQ
npx quorum-dev-quickstart --help
```

### Full System Test
```bash
# Generate a test network
npx quorum-dev-quickstart \
  --clientType besu \
  --validators 1 \
  --participants 1 \
  --monitoring none \
  --outputPath ./test-installation

# Start the network
cd test-installation
./run.sh

# Verify network is running
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'

# Clean up
./stop.sh && cd .. && rm -rf test-installation
```

## Troubleshooting Installation Issues

### Node.js Version Issues
```bash
# Check current version
node --version

# Using nvm (Node Version Manager) to manage versions
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Docker Permission Issues (Linux)
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply group changes (logout/login or use newgrp)
newgrp docker

# Test Docker access
docker run --rm hello-world
```

### Network Connectivity Issues
```bash
# Test internet connectivity
curl -I https://registry.npmjs.org/

# Check proxy settings if behind corporate firewall
npm config get proxy
npm config get https-proxy

# Configure npm proxy if needed
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

### Disk Space Issues
```bash
# Check available disk space
df -h

# Clean npm cache
npm cache clean --force

# Clean Docker images and containers
docker system prune -a
```

## Environment Configuration

### Node.js Configuration
```bash
# Increase Node.js memory limit for large networks
export NODE_OPTIONS="--max-old-space-size=4096"

# Set npm registry (if using private registry)
npm config set registry https://registry.npmjs.org/
```

### Docker Configuration
```bash
# Increase Docker memory limit (Linux)
# Edit /etc/docker/daemon.json
{
  "default-runtime": "runc",
  "storage-opts": ["overlay2.size=50G"],
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker daemon
sudo systemctl restart docker
```

### Development Environment Setup
```bash
# Create development workspace
mkdir -p ~/blockchain-dev
cd ~/blockchain-dev

# Set up environment variables
echo 'export QUORUM_DEV_PATH=~/blockchain-dev' >> ~/.bashrc
echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.bashrc
source ~/.bashrc
```

## Platform-Specific Notes

### Linux Considerations
- **Ubuntu 20.04+**: Recommended for best compatibility
- **SELinux**: May need to be configured or disabled for Docker
- **Firewall**: Ensure ports 8545, 25000, 3000 are accessible

### macOS Considerations
- **Apple Silicon (M1/M2)**: Fully supported with Docker Desktop
- **Rosetta 2**: Required for some Docker images on Apple Silicon
- **File system case sensitivity**: Generally not an issue

### Windows Considerations
- **WSL2**: Strongly recommended over native Windows
- **Path length limits**: May affect deep nested directories
- **Line endings**: Git should be configured for Windows line endings

## Next Steps

After successful installation:

1. **Run the Quick Start**: Follow the [Quick Start Guide](../getting-started/quick-start.md)
2. **Explore Examples**: Try different network configurations
3. **Read Documentation**: Familiarize yourself with CLI options
4. **Join Community**: Participate in GitHub discussions

## Support

If you encounter installation issues:

- **Check Requirements**: Ensure all prerequisites are met
- **Update Software**: Make sure you have the latest versions
- **Search Issues**: Check GitHub issues for similar problems
- **Create Issue**: Report installation problems with system details

---

**Installation Complete!** 🎉 You're ready to start building with Quorum networks.
---

**📝 Edit this page**: [Edit on GitHub](https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ/edit/feat/regional-topology-config/docs/getting-started/installation.md)
