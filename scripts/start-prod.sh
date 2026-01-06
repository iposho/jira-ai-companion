#!/bin/bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Navigate to project directory
cd "$(dirname "$0")/.."

# Export PORT from environment if set, otherwise use default
export PORT=${PORT:-3000}

# Build and start
npm run build && npm start
