#include <QApplication>
#include <QStyleFactory>
#include <QDir>
#include <QStandardPaths>
#include "mainwindow.h"
#include "settings.h"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    
    // Set application properties
    app.setApplicationName("Upload Client");
    app.setApplicationVersion("1.0.0");
    app.setOrganizationName("Shared Media Streaming");
    
    // Set application style
    app.setStyle(QStyleFactory::create("Fusion"));
    
    // Create settings directory if it doesn't exist
    QString settingsPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(settingsPath);
    
    // Initialize settings
    Settings::instance();
    
    // Create and show main window
    MainWindow window;
    window.show();
    
    return app.exec();
}

