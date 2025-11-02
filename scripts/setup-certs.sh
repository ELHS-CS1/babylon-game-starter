#!/bin/bash

# Setup SSL certificates for local HTTPS development
# This script generates mkcert certificates for localhost development

set -e

echo "🔐 Setting up SSL certificates for local HTTPS development..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert is not installed. Installing via Homebrew..."
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is not installed. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    brew install mkcert
fi

# Create certs directory
echo "📁 Creating certs directory..."
mkdir -p certs

# Generate certificates
echo "🔑 Generating SSL certificates for localhost development..."
cd certs

# Generate certificates for localhost, 127.0.0.1, and ::1
mkcert localhost 127.0.0.1 ::1

echo "✅ SSL certificates generated successfully!"
echo "📜 Certificate files:"
echo "   - certs/localhost+2.pem (certificate)"
echo "   - certs/localhost+2-key.pem (private key)"
echo ""
echo "🚀 You can now run 'npm run dev' for HTTPS development!"
echo "⚠️  Note: You may need to accept the self-signed certificate in your browser"
echo "   Click 'Advanced' → 'Proceed to localhost' when prompted"