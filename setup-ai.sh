#!/bin/bash

# BusyBob AI Setup Script
# This script installs and configures Ollama for local AI capabilities

set -e

echo "🚀 Setting up BusyBob AI with local capabilities..."

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS. Please install Ollama manually for other systems."
    echo "Visit: https://ollama.ai/download"
    exit 1
fi

# Check if Ollama is already installed
if command -v ollama &> /dev/null; then
    echo "✅ Ollama is already installed"
else
    echo "📦 Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
fi

# Start Ollama service
echo "🔄 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
sleep 5

# Pull the recommended model
echo "📥 Downloading Llama 3.2 model (this may take a few minutes)..."
ollama pull llama3.2

# Test the installation
echo "🧪 Testing AI connection..."
if ollama list | grep -q "llama3.2"; then
    echo "✅ Llama 3.2 model installed successfully"
else
    echo "❌ Failed to install Llama 3.2 model"
    exit 1
fi

# Create a test request
echo "🔍 Testing API endpoint..."
if curl -s -X POST http://localhost:11434/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "llama3.2",
        "messages": [{"role": "user", "content": "Hello! Are you working?"}],
        "stream": false
    }' > /dev/null; then
    echo "✅ AI API endpoint is working"
else
    echo "⚠️ AI API endpoint test failed, but installation completed"
fi

echo ""
echo "🎉 BusyBob AI setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. The AI agent will now use local Ollama for better privacy and reliability"
echo "2. Ollama is running on http://localhost:11434"
echo "3. The llama3.2 model is ready for use"
echo ""
echo "🔧 Advanced usage:"
echo "• Install additional models: ollama pull <model-name>"
echo "• List available models: ollama list"
echo "• Stop Ollama: pkill ollama"
echo ""
echo "💡 The BusyBob AI agent will automatically fall back to local AI"
echo "   and provide enhanced agentic capabilities!"

# Create a simple status check script
cat > check-ai-status.sh << 'EOF'
#!/bin/bash
echo "🔍 BusyBob AI Status Check"
echo "=========================="

if pgrep ollama > /dev/null; then
    echo "✅ Ollama service: Running"
else
    echo "❌ Ollama service: Stopped"
    echo "   Run: ollama serve"
fi

if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ API endpoint: Accessible"
    echo "📋 Available models:"
    curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | sed 's/^/   • /'
else
    echo "❌ API endpoint: Not accessible"
fi
EOF

chmod +x check-ai-status.sh

echo "📊 Created 'check-ai-status.sh' for monitoring AI status"
echo ""
echo "Run './check-ai-status.sh' anytime to check your AI setup!"
