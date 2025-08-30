#ifndef FOLDERSYNC_H
#define FOLDERSYNC_H

#include <QObject>
#include <QFileSystemWatcher>
#include <QTimer>
#include <QDir>
#include <QFileInfo>
#include <QHash>
#include <QMutex>
#include <QJsonObject>
#include <QJsonArray>
#include <QNetworkAccessManager>
#include <QNetworkReply>

struct SyncItem {
    QString localPath;
    QString remotePath;
    QString fileName;
    qint64 fileSize;
    QDateTime lastModified;
    QString status;
    bool isDirectory;
    
    SyncItem() : fileSize(0), isDirectory(false) {}
    SyncItem(const QString &path) : localPath(path), isDirectory(false) {
        QFileInfo info(path);
        fileName = info.fileName();
        fileSize = info.size();
        lastModified = info.lastModified();
        isDirectory = info.isDir();
        status = "Pending";
    }
    
    // Add comparison operators for QList operations
    bool operator==(const SyncItem &other) const {
        return localPath == other.localPath;
    }
    
    bool operator!=(const SyncItem &other) const {
        return localPath != other.localPath;
    }
};

class FolderSync : public QObject
{
    Q_OBJECT

public:
    explicit FolderSync(QObject *parent = nullptr);
    ~FolderSync();
    
    void setAuthToken(const QString &token);
    void setServerUrl(const QString &url);
    void addFolder(const QString &folderPath);
    void removeFolder(const QString &folderPath);
    void startSync();
    void stopSync();
    void forceSync();
    
    QStringList getSyncedFolders() const;
    QList<SyncItem> getSyncQueue() const;
    bool isSyncing() const;

signals:
    void syncProgress(int progress);
    void syncFinished();
    void syncError(const QString &error);
    void itemStatusChanged(int index, const QString &status);
    void folderAdded(const QString &folderPath);
    void folderRemoved(const QString &folderPath);

private slots:
    void onFileChanged(const QString &path);
    void onDirectoryChanged(const QString &path);
    void onSyncTimeout();
    void onNetworkReplyFinished();

private:
    void scanFolder(const QString &folderPath);
    void scanFile(const QString &filePath);
    void updateSyncQueue();
    void processSyncQueue();
    void uploadFile(const SyncItem &item);
    void createDirectory(const SyncItem &item);
    void removeRemoteItem(const SyncItem &item);
    void updateItemStatus(int index, const QString &status);
    
    // File system monitoring
    QFileSystemWatcher *m_fileWatcher;
    QStringList m_watchedFolders;
    
    // Network
    QNetworkAccessManager *m_networkManager;
    QNetworkReply *m_currentReply;
    QString m_authToken;
    QString m_serverUrl;
    
    // Sync state
    QList<SyncItem> m_syncQueue;
    QHash<QString, SyncItem> m_fileIndex;
    QMutex m_syncMutex;
    bool m_isSyncing;
    bool m_isEnabled;
    
    // Settings
    QTimer *m_syncTimer;
    int m_syncInterval;
    int m_maxRetries;
    int m_currentRetries;
    
    // File filters
    QStringList m_mediaExtensions;
    QStringList m_ignoredPatterns;
};

#endif // FOLDERSYNC_H
