#!/bin/bash

# Upload Client Build Script
# This script builds the Upload Client application for Unix-like systems

set -e  # Exit on any error

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect Qt installation
detect_qt() {
    local qt_path=""
    
    # Check common Qt installation paths
    if [ -d "/opt/homebrew/opt/qt6" ]; then
        qt_path="/opt/homebrew/opt/qt6"
    elif [ -d "/usr/local/opt/qt6" ]; then
        qt_path="/usr/local/opt/qt6"
    elif [ -d "/usr/lib/qt6" ]; then
        qt_path="/usr/lib/qt6"
    elif [ -d "/opt/qt6" ]; then
        qt_path="/opt/qt6"
    fi
    
    echo "$qt_path"
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check for CMake
    if ! command_exists cmake; then
        print_error "CMake not found. Please install CMake 3.16 or later."
        exit 1
    fi
    
    # Check CMake version
    local cmake_version=$(cmake --version | head -n1 | awk '{print $3}')
    local required_version="3.16.0"
    
    if [ "$(printf '%s\n' "$required_version" "$cmake_version" | sort -V | head -n1)" != "$required_version" ]; then
        print_error "CMake version $cmake_version is too old. Version $required_version or later is required."
        exit 1
    fi
    
    print_success "CMake version $cmake_version found"
    
    # Check for C++ compiler
    if command_exists g++; then
        print_success "G++ compiler found"
    elif command_exists clang++; then
        print_success "Clang++ compiler found"
    else
        print_error "No C++ compiler found. Please install g++ or clang++."
        exit 1
    fi
}

# Function to configure build
configure_build() {
    local build_dir="$1"
    local qt_path="$2"
    
    print_status "Configuring build in $build_dir..."
    
    cd "$build_dir"
    
    local cmake_args=""
    if [ -n "$qt_path" ]; then
        cmake_args="-DCMAKE_PREFIX_PATH=$qt_path"
        print_status "Using Qt from: $qt_path"
    fi
    
    if ! cmake .. $cmake_args; then
        print_error "CMake configuration failed"
        exit 1
    fi
    
    print_success "Build configuration completed"
}

# Function to build application
build_application() {
    local build_dir="$1"
    
    print_status "Building application..."
    
    cd "$build_dir"
    
    # Detect number of CPU cores for parallel build
    local cores=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 1)
    
    if ! make -j"$cores"; then
        print_error "Build failed"
        exit 1
    fi
    
    print_success "Build completed successfully"
}

# Function to run tests (if available)
run_tests() {
    local build_dir="$1"
    
    if [ -f "$build_dir/Makefile" ] && grep -q "test" "$build_dir/Makefile"; then
        print_status "Running tests..."
        cd "$build_dir"
        
        if make test; then
            print_success "All tests passed"
        else
            print_warning "Some tests failed"
        fi
    else
        print_status "No tests found, skipping test execution"
    fi
}

# Function to create distribution package
create_package() {
    local build_dir="$1"
    
    print_status "Creating distribution package..."
    
    cd "$build_dir"
    
    if command_exists make; then
        if make package; then
            print_success "Distribution package created"
        else
            print_warning "Failed to create distribution package"
        fi
    else
        print_warning "Make not available, skipping package creation"
    fi
}

# Function to show build summary
show_summary() {
    local build_dir="$1"
    
    print_success "Build completed successfully!"
    echo
    echo "Build Summary:"
    echo "=============="
    echo "Build directory: $build_dir"
    echo "Executable: $build_dir/bin/UploadClient"
    echo
    echo "To run the application:"
    echo "  cd $build_dir"
    echo "  ./bin/UploadClient"
    echo
    echo "To install the application:"
    echo "  cd $build_dir"
    echo "  sudo make install"
}

# Main build process
main() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local build_dir="$script_dir/build"
    
    echo "========================================"
    echo "    Upload Client Build Script"
    echo "========================================"
    echo
    
    # Change to script directory
    cd "$script_dir"
    
    # Check dependencies
    check_dependencies
    
    # Detect Qt installation
    local qt_path=$(detect_qt)
    if [ -z "$qt_path" ]; then
        print_warning "Qt6 not found in common locations"
        print_status "You may need to specify Qt path manually with -DCMAKE_PREFIX_PATH"
    else
        print_success "Qt6 found at: $qt_path"
    fi
    
    # Create build directory
    if [ ! -d "$build_dir" ]; then
        print_status "Creating build directory: $build_dir"
        mkdir -p "$build_dir"
    fi
    
    # Clean build directory if requested
    if [ "$1" = "clean" ]; then
        print_status "Cleaning build directory..."
        rm -rf "$build_dir"
        mkdir -p "$build_dir"
    fi
    
    # Configure build
    configure_build "$build_dir" "$qt_path"
    
    # Build application
    build_application "$build_dir"
    
    # Run tests
    run_tests "$build_dir"
    
    # Create package
    create_package "$build_dir"
    
    # Show summary
    show_summary "$build_dir"
}

# Handle command line arguments
case "${1:-}" in
    clean)
        print_status "Clean build requested"
        main clean
        ;;
    help|--help|-h)
        echo "Usage: $0 [clean|help]"
        echo
        echo "Options:"
        echo "  clean    Clean build directory before building"
        echo "  help     Show this help message"
        echo
        echo "Examples:"
        echo "  $0          # Build normally"
        echo "  $0 clean    # Clean and rebuild"
        echo "  $0 help     # Show this help"
        ;;
    *)
        main
        ;;
esac
