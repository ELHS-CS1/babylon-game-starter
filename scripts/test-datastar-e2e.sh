#!/bin/bash

# DataStar Multiplayer E2E Test Runner
# Following official DataStar documentation patterns
# Tests DataStar SSE connection, DOM patching, and multiplayer functionality

set -e

echo "🚀 DataStar Multiplayer E2E Test Runner"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start DataStar SSE server
start_datastar_server() {
    print_status "Starting DataStar SSE server on port 10000..."
    
    if check_port 10000; then
        print_warning "Port 10000 is already in use. Attempting to use existing server..."
        return 0
    fi
    
    # Start the DataStar SSE server in background
    node scripts/test-server.js &
    SERVER_PID=$!
    
    # Wait for server to start
    print_status "Waiting for DataStar SSE server to start..."
    sleep 3
    
    # Check if server is running
    if check_port 10000; then
        print_success "DataStar SSE server started successfully (PID: $SERVER_PID)"
        return 0
    else
        print_error "Failed to start DataStar SSE server"
        return 1
    fi
}

# Function to stop DataStar SSE server
stop_datastar_server() {
    if [ ! -z "$SERVER_PID" ]; then
        print_status "Stopping DataStar SSE server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
        print_success "DataStar SSE server stopped"
    fi
}

# Function to test DataStar SSE connection
test_datastar_connection() {
    print_status "Testing DataStar SSE connection..."
    
    # Test SSE endpoint
    local sse_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:10000/api/datastar/sse)
    if [ "$sse_response" = "200" ]; then
        print_success "DataStar SSE endpoint is responding"
    else
        print_error "DataStar SSE endpoint failed (HTTP $sse_response)"
        return 1
    fi
    
    # Test DataStar send endpoint
    local send_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"type":"datastar-patch-elements","data":"<div id=\"test\">DataStar Test</div>"}' \
        http://localhost:10000/api/datastar/send)
    
    if [ "$send_response" = "200" ]; then
        print_success "DataStar send endpoint is responding"
    else
        print_error "DataStar send endpoint failed (HTTP $send_response)"
        return 1
    fi
    
    return 0
}

# Function to run DataStar e2e tests
run_datastar_tests() {
    print_status "Running DataStar e2e tests..."
    
    # Run DataStar multiplayer tests
    print_status "Running DataStar multiplayer tests..."
    npx playwright test tests/datastar-multiplayer.spec.ts --reporter=line
    
    # Run DataStar peer connection tests
    print_status "Running DataStar peer connection tests..."
    npx playwright test tests/peer-connections.spec.ts --reporter=line
    
    # Run DataStar SSE server asset tests
    print_status "Running DataStar SSE server asset tests..."
    npx playwright test tests/sse-server-assets.spec.ts --reporter=line
    
    print_success "All DataStar e2e tests completed"
}

# Function to run specific test suite
run_specific_tests() {
    local test_suite=$1
    
    case $test_suite in
        "multiplayer")
            print_status "Running DataStar multiplayer tests only..."
            npx playwright test tests/datastar-multiplayer.spec.ts --reporter=line
            ;;
        "peers")
            print_status "Running DataStar peer connection tests only..."
            npx playwright test tests/peer-connections.spec.ts --reporter=line
            ;;
        "assets")
            print_status "Running DataStar SSE server asset tests only..."
            npx playwright test tests/sse-server-assets.spec.ts --reporter=line
            ;;
        *)
            print_error "Unknown test suite: $test_suite"
            print_status "Available test suites: multiplayer, peers, assets"
            exit 1
            ;;
    esac
}

# Function to run tests in headed mode
run_headed_tests() {
    print_status "Running DataStar e2e tests in headed mode..."
    
    # Run all DataStar tests in headed mode
    npx playwright test tests/datastar-multiplayer.spec.ts tests/peer-connections.spec.ts tests/sse-server-assets.spec.ts --headed --reporter=line
}

# Function to run tests with debug output
run_debug_tests() {
    print_status "Running DataStar e2e tests with debug output..."
    
    # Run tests with debug output
    DEBUG=pw:api npx playwright test tests/datastar-multiplayer.spec.ts tests/peer-connections.spec.ts tests/sse-server-assets.spec.ts --reporter=line
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    stop_datastar_server
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    print_status "Starting DataStar Multiplayer E2E Test Suite"
    echo ""
    
    # Parse command line arguments
    case "${1:-all}" in
        "all")
            start_datastar_server
            test_datastar_connection
            run_datastar_tests
            ;;
        "multiplayer"|"peers"|"assets")
            start_datastar_server
            test_datastar_connection
            run_specific_tests "$1"
            ;;
        "headed")
            start_datastar_server
            test_datastar_connection
            run_headed_tests
            ;;
        "debug")
            start_datastar_server
            test_datastar_connection
            run_debug_tests
            ;;
        "connection")
            start_datastar_server
            test_datastar_connection
            print_success "DataStar connection test completed"
            ;;
        "help"|"-h"|"--help")
            echo "DataStar Multiplayer E2E Test Runner"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  all         Run all DataStar e2e tests (default)"
            echo "  multiplayer Run DataStar multiplayer tests only"
            echo "  peers       Run DataStar peer connection tests only"
            echo "  assets      Run DataStar SSE server asset tests only"
            echo "  headed      Run tests in headed mode (visible browser)"
            echo "  debug       Run tests with debug output"
            echo "  connection  Test DataStar SSE connection only"
            echo "  help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Run all tests"
            echo "  $0 multiplayer       # Run multiplayer tests only"
            echo "  $0 headed            # Run tests with visible browser"
            echo "  $0 debug             # Run tests with debug output"
            exit 0
            ;;
        *)
            print_error "Unknown command: $1"
            print_status "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    print_success "DataStar Multiplayer E2E Test Suite completed successfully!"
}

# Run main function with all arguments
main "$@"
