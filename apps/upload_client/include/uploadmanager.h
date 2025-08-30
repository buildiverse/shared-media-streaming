#ifndef UPLOADMANAGER_H
#define UPLOADMANAGER_H

#include <QObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QFile>
#include <QFileInfo>
#include <QQueue>
#include <QMutex>
#include <QTimer>
#include <QJsonObject>
#include <QJsonArray>

struct UploadItem {
    QString filePath;
    QString fileName;
    qint64 fileSize;
    QString status;
    int progress;
    QFile *file;
    
    UploadItem() : fileSize(0), progress(0), file(nullptr) {}
    UploadItem(const QString &path) : filePath(path), file(nullptr) {
        QFileInfo info(path);
        fileName = info.fileName();
        fileSize = info.size();
        status = "Pending";
        progress = 0;
    }
    
    // Add comparison operators for QList operations
    bool operator==(const UploadItem &other) const {
        return filePath == other.filePath;
    }
    
    bool operator!=(const UploadItem &other) const {
        return filePath != other.filePath;
    }
};

class UploadManager : public QObject
{
    Q_OBJECT

public:
    explicit UploadManager(QObject *parent = nullptr);
    ~UploadManager();
    
    void setAuthToken(const QString &token);
    void setServerUrl(const QString &url);
    void addFile(const QString &filePath);
    void addFolder(const QString &folderPath);
    void startUpload();
    void pauseUpload();
    void resumeUpload();
    void clearQueue();
    
    QList<UploadItem> getQueue() const;
    bool isUploading() const;

signals:
    void uploadProgress(int progress);
    void uploadFinished();
    void uploadError(const QString &error);
    void itemProgressChanged(int index, int progress);
    void itemStatusChanged(int index, const QString &status);

private slots:
    void processNextUpload();
    void onUploadProgress(qint64 bytesSent, qint64 bytesTotal);
    void onUploadFinished();
    void onNetworkError(QNetworkReply::NetworkError error);

private:
    void scanFolder(const QString &folderPath);
    void createMultipartRequest(const UploadItem &item);
    void updateItemProgress(int index, int progress);
    void updateItemStatus(int index, const QString &status);
    
    // Network
    QNetworkAccessManager *m_networkManager;
    QNetworkReply *m_currentReply;
    QString m_authToken;
    QString m_serverUrl;
    
    // Upload queue
    QQueue<UploadItem> m_uploadQueue;
    QMutex m_queueMutex;
    int m_currentIndex;
    bool m_isUploading;
    bool m_isPaused;
    
    // Settings
    int m_maxConcurrentUploads;
    int m_chunkSize;
    QTimer *m_retryTimer;
    int m_maxRetries;
    int m_currentRetries;
};

#endif // UPLOADMANAGER_H
