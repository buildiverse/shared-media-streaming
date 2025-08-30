#include "settings.h"
#include <QApplication>
#include <QStandardPaths>
#include <QDir>
#include <QDebug>

// Default values
const QString Settings::DEFAULT_SERVER_URL = "http://localhost:3000";
const int Settings::DEFAULT_MAX_CONCURRENT_UPLOADS = 3;
const int Settings::DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB
const int Settings::DEFAULT_MAX_RETRIES = 3;
const int Settings::DEFAULT_SYNC_INTERVAL = 300000; // 5 minutes
const int Settings::DEFAULT_NETWORK_TIMEOUT = 30000; // 30 seconds
const QStringList Settings::DEFAULT_MEDIA_EXTENSIONS = {
    ".mp4", ".avi", ".mov", ".mkv", ".mp3", ".wav", ".flac",
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"
};
const QStringList Settings::DEFAULT_IGNORED_PATTERNS = {
    "*.tmp", "*.temp", "*.cache", "*.log", "Thumbs.db", ".DS_Store"
};

Settings::Settings(QObject *parent)
    : QObject(parent)
    , m_settings(nullptr)
{
    // Create settings directory if it doesn't exist
    QString settingsPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(settingsPath);
    
    // Initialize settings
    m_settings = new QSettings(settingsPath + "/uploadclient.ini", QSettings::IniFormat, this);
    
    // Set organization and application info
    // Note: setIniCodec was removed in Qt6, UTF-8 is default
}

Settings::~Settings()
{
    if (m_settings) {
        m_settings->sync();
    }
}

Settings* Settings::instance()
{
    static Settings instance;
    return &instance;
}

// Authentication settings
QString Settings::getAuthToken() const
{
    return m_settings->value("auth/token").toString();
}

void Settings::setAuthToken(const QString &token)
{
    m_settings->setValue("auth/token", token);
    emit settingsChanged("auth", "token", token);
}

QString Settings::getUsername() const
{
    return m_settings->value("auth/username").toString();
}

void Settings::setUsername(const QString &username)
{
    m_settings->setValue("auth/username", username);
    emit settingsChanged("auth", "username", username);
}

QString Settings::getServerUrl() const
{
    return m_settings->value("auth/serverUrl", DEFAULT_SERVER_URL).toString();
}

void Settings::setServerUrl(const QString &url)
{
    m_settings->setValue("auth/serverUrl", url);
    emit settingsChanged("auth", "serverUrl", url);
}

bool Settings::getRememberMe() const
{
    return m_settings->value("auth/rememberMe", false).toBool();
}

void Settings::setRememberMe(bool remember)
{
    m_settings->setValue("auth/rememberMe", remember);
    emit settingsChanged("auth", "rememberMe", remember);
}

// Upload settings
int Settings::getMaxConcurrentUploads() const
{
    return m_settings->value("upload/maxConcurrent", DEFAULT_MAX_CONCURRENT_UPLOADS).toInt();
}

void Settings::setMaxConcurrentUploads(int max)
{
    m_settings->setValue("upload/maxConcurrent", max);
    emit settingsChanged("upload", "maxConcurrent", max);
}

int Settings::getChunkSize() const
{
    return m_settings->value("upload/chunkSize", DEFAULT_CHUNK_SIZE).toInt();
}

void Settings::setChunkSize(int size)
{
    m_settings->setValue("upload/chunkSize", size);
    emit settingsChanged("upload", "chunkSize", size);
}

int Settings::getMaxRetries() const
{
    return m_settings->value("upload/maxRetries", DEFAULT_MAX_RETRIES).toInt();
}

void Settings::setMaxRetries(int retries)
{
    m_settings->setValue("upload/maxRetries", retries);
    emit settingsChanged("upload", "maxRetries", retries);
}

QString Settings::getUploadServerUrl() const
{
    return m_settings->value("upload/serverUrl", DEFAULT_SERVER_URL).toString();
}

void Settings::setUploadServerUrl(const QString &url)
{
    m_settings->setValue("upload/serverUrl", url);
    emit settingsChanged("upload", "serverUrl", url);
}

// Sync settings
QStringList Settings::getSyncedFolders() const
{
    return m_settings->value("sync/folders").toStringList();
}

void Settings::setSyncedFolders(const QStringList &folders)
{
    m_settings->setValue("sync/folders", folders);
    emit settingsChanged("sync", "folders", folders);
}

void Settings::addSyncedFolder(const QString &folder)
{
    QStringList folders = getSyncedFolders();
    if (!folders.contains(folder)) {
        folders.append(folder);
        setSyncedFolders(folders);
    }
}

void Settings::removeSyncedFolder(const QString &folder)
{
    QStringList folders = getSyncedFolders();
    folders.removeOne(folder);
    setSyncedFolders(folders);
}

int Settings::getSyncInterval() const
{
    return m_settings->value("sync/interval", DEFAULT_SYNC_INTERVAL).toInt();
}

void Settings::setSyncInterval(int interval)
{
    m_settings->setValue("sync/interval", interval);
    emit settingsChanged("sync", "interval", interval);
}

int Settings::getSyncMaxRetries() const
{
    return m_settings->value("sync/maxRetries", DEFAULT_MAX_RETRIES).toInt();
}

void Settings::setSyncMaxRetries(int retries)
{
    m_settings->setValue("sync/maxRetries", retries);
    emit settingsChanged("sync", "maxRetries", retries);
}

QString Settings::getSyncServerUrl() const
{
    return m_settings->value("sync/serverUrl", DEFAULT_SERVER_URL).toString();
}

void Settings::setSyncServerUrl(const QString &url)
{
    m_settings->setValue("sync/serverUrl", url);
    emit settingsChanged("sync", "serverUrl", url);
}

// Network settings
int Settings::getNetworkTimeout() const
{
    return m_settings->value("network/timeout", DEFAULT_NETWORK_TIMEOUT).toInt();
}

void Settings::setNetworkTimeout(int timeout)
{
    m_settings->setValue("network/timeout", timeout);
    emit settingsChanged("network", "timeout", timeout);
}

QString Settings::getNetworkServerUrl() const
{
    return m_settings->value("network/serverUrl", DEFAULT_SERVER_URL).toString();
}

void Settings::setNetworkServerUrl(const QString &url)
{
    m_settings->setValue("network/serverUrl", url);
    emit settingsChanged("network", "serverUrl", url);
}

// UI settings
QSize Settings::getWindowSize() const
{
    return m_settings->value("ui/windowSize", QSize(1200, 800)).toSize();
}

void Settings::setWindowSize(const QSize &size)
{
    m_settings->setValue("ui/windowSize", size);
    emit settingsChanged("ui", "windowSize", size);
}

QPoint Settings::getWindowPosition() const
{
    return m_settings->value("ui/windowPosition", QPoint(100, 100)).toPoint();
}

void Settings::setWindowPosition(const QPoint &position)
{
    m_settings->setValue("ui/windowPosition", position);
    emit settingsChanged("ui", "windowPosition", position);
}

QByteArray Settings::getWindowState() const
{
    return m_settings->value("ui/windowState").toByteArray();
}

void Settings::setWindowState(const QByteArray &state)
{
    m_settings->setValue("ui/windowState", state);
    emit settingsChanged("ui", "windowState", state);
}

QByteArray Settings::getWindowGeometry() const
{
    return m_settings->value("ui/windowGeometry").toByteArray();
}

void Settings::setWindowGeometry(const QByteArray &geometry)
{
    m_settings->setValue("ui/windowGeometry", geometry);
    emit settingsChanged("ui", "windowGeometry", geometry);
}

// General settings
bool Settings::getAutoStart() const
{
    return m_settings->value("general/autoStart", false).toBool();
}

void Settings::setAutoStart(bool autoStart)
{
    m_settings->setValue("general/autoStart", autoStart);
    emit settingsChanged("general", "autoStart", autoStart);
}

bool Settings::getMinimizeToTray() const
{
    return m_settings->value("general/minimizeToTray", true).toBool();
}

void Settings::setMinimizeToTray(bool minimize)
{
    m_settings->setValue("general/minimizeToTray", minimize);
    emit settingsChanged("general", "minimizeToTray", minimize);
}

bool Settings::getStartMinimized() const
{
    return m_settings->value("general/startMinimized", false).toBool();
}

void Settings::setStartMinimized(bool minimized)
{
    m_settings->setValue("general/startMinimized", minimized);
    emit settingsChanged("general", "startMinimized", minimized);
}

QString Settings::getLanguage() const
{
    return m_settings->value("general/language", "en").toString();
}

void Settings::setLanguage(const QString &language)
{
    m_settings->setValue("general/language", language);
    emit settingsChanged("general", "language", language);
}

// File filters
QStringList Settings::getMediaExtensions() const
{
    return m_settings->value("filters/mediaExtensions", DEFAULT_MEDIA_EXTENSIONS).toStringList();
}

void Settings::setMediaExtensions(const QStringList &extensions)
{
    m_settings->setValue("filters/mediaExtensions", extensions);
    emit settingsChanged("filters", "mediaExtensions", extensions);
}

QStringList Settings::getIgnoredPatterns() const
{
    return m_settings->value("filters/ignoredPatterns", DEFAULT_IGNORED_PATTERNS).toStringList();
}

void Settings::setIgnoredPatterns(const QStringList &patterns)
{
    m_settings->setValue("filters/ignoredPatterns", patterns);
    emit settingsChanged("filters", "ignoredPatterns", patterns);
}

// Clear methods
void Settings::clear()
{
    m_settings->clear();
    emit settingsChanged("", "", QVariant());
}

void Settings::clearAuth()
{
    m_settings->remove("auth");
    emit settingsChanged("auth", "", QVariant());
}

void Settings::clearUpload()
{
    m_settings->remove("upload");
    emit settingsChanged("upload", "", QVariant());
}

void Settings::clearSync()
{
    m_settings->remove("sync");
    emit settingsChanged("sync", "", QVariant());
}

void Settings::clearNetwork()
{
    m_settings->remove("network");
    emit settingsChanged("network", "", QVariant());
}

void Settings::clearUI()
{
    m_settings->remove("ui");
    emit settingsChanged("ui", "", QVariant());
}
