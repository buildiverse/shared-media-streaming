# Upload Client

A cross-platform Qt desktop application for syncing and uploading media files to the Shared Media Streaming platform.

## Features

- **Cross-platform**: Supports macOS, Windows, and Linux
- **Authentication**: Secure login with JWT tokens
- **Folder Sync**: Monitor and sync entire folders automatically
- **File Upload**: Upload individual files or entire directories
- **Real-time Monitoring**: File system watcher for automatic sync
- **Progress Tracking**: Visual progress bars and status updates
- **Settings Management**: Persistent configuration and preferences
- **Network Management**: Robust error handling and retry logic

## Requirements

### Build Requirements

- **Qt 6.0+** (Core, Widgets, Network modules)
- **CMake 3.16+**
- **C++17 compatible compiler**
- **Git**

### Runtime Requirements

- **macOS 10.15+** (Catalina)
- **Windows 10+**
- **Linux** (Ubuntu 18.04+, CentOS 7+, etc.)

## Building from Source

### Prerequisites

1. **Install Qt 6**
   - Download from [Qt Official Website](https://www.qt.io/download)
   - Or use package manager:

     ```bash
     # macOS (using Homebrew)
     brew install qt6

     # Ubuntu/Debian
     sudo apt install qt6-base-dev qt6-base-dev-tools

     # Windows (using vcpkg)
     vcpkg install qt6-base
     ```

2. **Install CMake**

   ```bash
   # macOS
   brew install cmake

   # Ubuntu/Debian
   sudo apt install cmake

   # Windows
   # Download from https://cmake.org/download/
   ```

3. **Install C++ Compiler**

   ```bash
   # macOS
   xcode-select --install

   # Ubuntu/Debian
   sudo apt install build-essential

   # Windows
   # Install Visual Studio Build Tools or MinGW
   ```

### Build Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd shared-media-streaming/apps/upload_client
   ```

2. **Create build directory**

   ```bash
   mkdir build
   cd build
   ```

3. **Configure with CMake**

   ```bash
   cmake .. -DCMAKE_PREFIX_PATH=/path/to/qt6

   # macOS (if Qt is installed via Homebrew)
   cmake .. -DCMAKE_PREFIX_PATH=/opt/homebrew/opt/qt6

   # Linux (if Qt is installed system-wide)
   cmake ..

   # Windows
   cmake .. -G "Visual Studio 16 2019" -A x64
   ```

4. **Build the application**

   ```bash
   # Unix-like systems
   make -j$(nproc)

   # Windows
   cmake --build . --config Release
   ```

5. **Install (optional)**

   ```bash
   # Unix-like systems
   sudo make install

   # Windows
   cmake --build . --config Release --target install
   ```

## Usage

### First Run

1. **Launch the application**

   ```bash
   # From build directory
   ./bin/UploadClient

   # Or if installed
   UploadClient
   ```

2. **Login**
   - Enter your server URL (default: http://localhost:3000)
   - Enter your username and password
   - Check "Remember me" to save credentials

3. **Add Folders to Sync**
   - Click "Add Folder to Sync"
   - Select a folder containing media files
   - The application will monitor this folder for changes

### Features

#### Folder Synchronization

- **Automatic Monitoring**: Watches synced folders for file changes
- **Media File Detection**: Automatically detects media files (images, videos, audio)
- **Real-time Sync**: Files are uploaded as soon as they're added or modified
- **Periodic Sync**: Runs every 5 minutes to catch any missed changes

#### File Upload

- **Drag & Drop**: Drag files or folders to the upload queue
- **Batch Upload**: Upload multiple files simultaneously
- **Progress Tracking**: Real-time progress bars for each upload
- **Retry Logic**: Automatic retry on network failures

#### Settings

- **Server Configuration**: Set different servers for different operations
- **Upload Limits**: Configure concurrent uploads and chunk sizes
- **Sync Intervals**: Adjust how often folders are synchronized
- **File Filters**: Customize which file types are synced

## Configuration

### Settings File Location

- **macOS**: `~/Library/Application Support/UploadClient/uploadclient.ini`
- **Windows**: `%APPDATA%\UploadClient\uploadclient.ini`
- **Linux**: `~/.local/share/UploadClient/uploadclient.ini`

### Key Settings

```ini
[auth]
serverUrl=http://localhost:3000
username=your_username
token=your_jwt_token
rememberMe=true

[upload]
maxConcurrent=3
chunkSize=1048576
maxRetries=3

[sync]
interval=300000
maxRetries=3

[network]
timeout=30000
```

## Development

### Project Structure

```
apps/upload_client/
├── include/           # Header files
├── src/              # Source files
├── ui/               # Qt Designer UI files
├── resources/        # Application resources
├── macos/            # macOS-specific files
├── CMakeLists.txt    # Build configuration
└── README.md         # This file
```

### Key Classes

- **MainWindow**: Main application window and UI
- **AuthDialog**: Authentication dialog
- **UploadManager**: Handles file uploads
- **FolderSync**: Manages folder synchronization
- **NetworkManager**: Network operations and error handling
- **Settings**: Application settings management

### Adding New Features

1. **Create header file** in `include/` directory
2. **Implement class** in `src/` directory
3. **Add to CMakeLists.txt** if needed
4. **Update UI** if required
5. **Test thoroughly** on all platforms

## Troubleshooting

### Common Issues

#### Build Issues

- **Qt not found**: Ensure Qt6 is installed and `CMAKE_PREFIX_PATH` is set correctly
- **Compiler errors**: Ensure C++17 support is enabled
- **Missing dependencies**: Install required system packages

#### Runtime Issues

- **Authentication fails**: Check server URL and credentials
- **Uploads fail**: Verify network connectivity and server status
- **Sync not working**: Check folder permissions and file system watcher support

#### Platform-Specific Issues

- **macOS**: Ensure proper code signing for distribution
- **Windows**: Check firewall and antivirus settings
- **Linux**: Verify file system watcher support (inotify)

### Debug Mode

Enable debug output by setting the `QT_LOGGING_RULES` environment variable:

```bash
# Unix-like systems
export QT_LOGGING_RULES="*.debug=true"
./UploadClient

# Windows
set QT_LOGGING_RULES=*.debug=true
UploadClient.exe
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on all platforms
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Check the troubleshooting section
- Review the code documentation

## Changelog

### Version 1.0.0

- Initial release
- Cross-platform support
- Authentication system
- Folder synchronization
- File upload management
- Settings persistence
- Network error handling
