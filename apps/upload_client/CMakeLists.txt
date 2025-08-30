cmake_minimum_required(VERSION 3.16)
project(UploadClient VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Qt6 components
find_package(Qt6 REQUIRED COMPONENTS Core Widgets Network)

# Set output directories
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# Source files
set(SOURCES
    src/main.cpp
    src/mainwindow.cpp
    src/authdialog.cpp
    src/uploadmanager.cpp
    src/foldersync.cpp
    src/settings.cpp
    src/networkmanager.cpp
)

set(HEADERS
    include/mainwindow.h
    include/authdialog.h
    include/uploadmanager.h
    include/foldersync.h
    include/settings.h
    include/networkmanager.h
)

set(UI_FILES
    ui/mainwindow.ui
    ui/authdialog.ui
)

set(RESOURCES
    resources/resources.qrc
)

# Create executable
add_executable(UploadClient ${SOURCES} ${HEADERS} ${UI_FILES} ${RESOURCES})

# Include directories
target_include_directories(UploadClient PRIVATE include)

# Enable Qt MOC for all headers
set_target_properties(UploadClient PROPERTIES
    AUTOMOC ON
    AUTOUIC ON
    AUTORCC ON
)

# Link Qt libraries
target_link_libraries(UploadClient PRIVATE
    Qt6::Core
    Qt6::Widgets
    Qt6::Network
)

# Platform-specific settings
if(WIN32)
    set_target_properties(UploadClient PROPERTIES
        WIN32_EXECUTABLE TRUE
    )
endif()

if(APPLE)
    set_target_properties(UploadClient PROPERTIES
        MACOSX_BUNDLE TRUE
        MACOSX_BUNDLE_INFO_PLIST ${CMAKE_CURRENT_SOURCE_DIR}/macos/Info.plist
    )
endif()

# Install rules
install(TARGETS UploadClient
    RUNTIME DESTINATION bin
    BUNDLE DESTINATION .
)

