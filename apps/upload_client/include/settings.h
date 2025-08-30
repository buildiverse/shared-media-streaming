#ifndef SETTINGS_H
#define SETTINGS_H

#include <QObject>
#include <QSettings>
#include <QString>
#include <QStringList>
#include <QSize>
#include <QPoint>
#include <QByteArray>

class Settings : public QObject
{
    Q_OBJECT

public:
    static Settings* instance();
    
    // Authentication settings
    QString getAuthToken() const;
    void setAuthToken(const QString &token);
    QString getUsername() const;
    void setUsername(const QString &username);
    QString getServerUrl() const;
    void setServerUrl(const QString &url);
    bool getRememberMe() const;
    void setRememberMe(bool remember);
    
    // Upload settings
    int getMaxConcurrentUploads() const;
    void setMaxConcurrentUploads(int max);
    int getChunkSize() const;
    void setChunkSize(int size);
    int getMaxRetries() const;
    void setMaxRetries(int retries);
    QString getUploadServerUrl() const;
    void setUploadServerUrl(const QString &url);
    
    // Sync settings
    QStringList getSyncedFolders() const;
    void setSyncedFolders(const QStringList &folders);
    void addSyncedFolder(const QString &folder);
    void removeSyncedFolder(const QString &folder);
    int getSyncInterval() const;
    void setSyncInterval(int interval);
    int getSyncMaxRetries() const;
    void setSyncMaxRetries(int retries);
    QString getSyncServerUrl() const;
    void setSyncServerUrl(const QString &url);
    
    // Network settings
    int getNetworkTimeout() const;
    void setNetworkTimeout(int timeout);
    QString getNetworkServerUrl() const;
    void setNetworkServerUrl(const QString &url);
    
    // UI settings
    QSize getWindowSize() const;
    void setWindowSize(const QSize &size);
    QPoint getWindowPosition() const;
    void setWindowPosition(const QPoint &position);
    QByteArray getWindowState() const;
    void setWindowState(const QByteArray &state);
    QByteArray getWindowGeometry() const;
    void setWindowGeometry(const QByteArray &geometry);
    
    // General settings
    bool getAutoStart() const;
    void setAutoStart(bool autoStart);
    bool getMinimizeToTray() const;
    void setMinimizeToTray(bool minimize);
    bool getStartMinimized() const;
    void setStartMinimized(bool minimized);
    QString getLanguage() const;
    void setLanguage(const QString &language);
    
    // File filters
    QStringList getMediaExtensions() const;
    void setMediaExtensions(const QStringList &extensions);
    QStringList getIgnoredPatterns() const;
    void setIgnoredPatterns(const QStringList &patterns);
    
    // Clear all settings
    void clear();
    void clearAuth();
    void clearUpload();
    void clearSync();
    void clearNetwork();
    void clearUI();

signals:
    void settingsChanged(const QString &group, const QString &key, const QVariant &value);

private:
    explicit Settings(QObject *parent = nullptr);
    ~Settings();
    
    Settings(const Settings&) = delete;
    Settings& operator=(const Settings&) = delete;
    
    QSettings *m_settings;
    
    // Default values
    static const QString DEFAULT_SERVER_URL;
    static const int DEFAULT_MAX_CONCURRENT_UPLOADS;
    static const int DEFAULT_CHUNK_SIZE;
    static const int DEFAULT_MAX_RETRIES;
    static const int DEFAULT_SYNC_INTERVAL;
    static const int DEFAULT_NETWORK_TIMEOUT;
    static const QStringList DEFAULT_MEDIA_EXTENSIONS;
    static const QStringList DEFAULT_IGNORED_PATTERNS;
};

#endif // SETTINGS_H
