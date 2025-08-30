#include "uploadmanager.h"
#include <QDir>
#include <QDirIterator>
#include <QHttpMultiPart>
#include <QHttpPart>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QSettings>
#include <QApplication>
#include <QStandardPaths>
#include <QFileDialog>

UploadManager::UploadManager(QObject *parent)
    : QObject(parent)
    , m_currentReply(nullptr)
    , m_currentIndex(-1)
    , m_isUploading(false)
    , m_isPaused(false)
    , m_maxConcurrentUploads(3)
    , m_chunkSize(1024 * 1024) // 1MB chunks
    , m_maxRetries(3)
    , m_currentRetries(0)
{
    m_networkManager = new QNetworkAccessManager(this);
    m_retryTimer = new QTimer(this);
    m_retryTimer->setSingleShot(true);
    
    connect(m_retryTimer, &QTimer::timeout, this, &UploadManager::processNextUpload);
    
    // Load settings
    QSettings settings;
    m_serverUrl = settings.value("upload/serverUrl", "http://localhost:3000").toString();
    m_maxConcurrentUploads = settings.value("upload/maxConcurrent", 3).toInt();
    m_chunkSize = settings.value("upload/chunkSize", 1024 * 1024).toInt();
    m_maxRetries = settings.value("upload/maxRetries", 3).toInt();
}

UploadManager::~UploadManager()
{
    clearQueue();
}

void UploadManager::setAuthToken(const QString &token)
{
    m_authToken = token;
}

void UploadManager::setServerUrl(const QString &url)
{
    m_serverUrl = url;
    
    // Save to settings
    QSettings settings;
    settings.setValue("upload/serverUrl", url);
}

void UploadManager::addFile(const QString &filePath)
{
    QMutexLocker locker(&m_queueMutex);
    
    QFileInfo fileInfo(filePath);
    if (!fileInfo.exists() || !fileInfo.isFile()) {
        emit uploadError(QString("File does not exist: %1").arg(filePath));
        return;
    }
    
    UploadItem item(filePath);
    m_uploadQueue.enqueue(item);
    
    emit itemStatusChanged(m_uploadQueue.size() - 1, "Added to queue");
}

void UploadManager::addFolder(const QString &folderPath)
{
    QMutexLocker locker(&m_queueMutex);
    
    QDir dir(folderPath);
    if (!dir.exists()) {
        emit uploadError(QString("Folder does not exist: %1").arg(folderPath));
        return;
    }
    
    scanFolder(folderPath);
}

void UploadManager::startUpload()
{
    if (m_isUploading || m_uploadQueue.isEmpty()) {
        return;
    }
    
    m_isUploading = true;
    m_isPaused = false;
    m_currentIndex = 0;
    m_currentRetries = 0;
    
    emit uploadProgress(0);
    processNextUpload();
}

void UploadManager::pauseUpload()
{
    m_isPaused = true;
    if (m_currentReply) {
        m_currentReply->abort();
    }
}

void UploadManager::resumeUpload()
{
    if (m_isPaused && m_isUploading) {
        m_isPaused = false;
        processNextUpload();
    }
}

void UploadManager::clearQueue()
{
    QMutexLocker locker(&m_queueMutex);
    
    // Stop current upload
    if (m_currentReply) {
        m_currentReply->abort();
        m_currentReply = nullptr;
    }
    
    // Clear queue
    while (!m_uploadQueue.isEmpty()) {
        UploadItem item = m_uploadQueue.dequeue();
        if (item.file) {
            item.file->close();
            delete item.file;
        }
    }
    
    m_isUploading = false;
    m_isPaused = false;
    m_currentIndex = -1;
    m_currentRetries = 0;
    
    emit uploadProgress(0);
}

QList<UploadItem> UploadManager::getQueue() const
{
    QMutexLocker locker(const_cast<QMutex*>(&m_queueMutex));
    return QList<UploadItem>(m_uploadQueue.begin(), m_uploadQueue.end());
}

bool UploadManager::isUploading() const
{
    return m_isUploading;
}

void UploadManager::processNextUpload()
{
    if (m_isPaused || !m_isUploading) {
        return;
    }
    
    QMutexLocker locker(&m_queueMutex);
    
    if (m_uploadQueue.isEmpty()) {
        m_isUploading = false;
        m_currentIndex = -1;
        emit uploadFinished();
        return;
    }
    
    if (m_currentIndex >= m_uploadQueue.size()) {
        m_isUploading = false;
        m_currentIndex = -1;
        emit uploadFinished();
        return;
    }
    
    UploadItem &item = m_uploadQueue[m_currentIndex];
    
    // Check if file still exists
    if (!QFile::exists(item.filePath)) {
        updateItemStatus(m_currentIndex, "File not found");
        m_currentIndex++;
        processNextUpload();
        return;
    }
    
    // Open file
    if (!item.file) {
        item.file = new QFile(item.filePath);
        if (!item.file->open(QIODevice::ReadOnly)) {
            updateItemStatus(m_currentIndex, "Cannot open file");
            m_currentIndex++;
            processNextUpload();
            return;
        }
    }
    
    updateItemStatus(m_currentIndex, "Uploading...");
    createMultipartRequest(item);
}

void UploadManager::onUploadProgress(qint64 bytesSent, qint64 bytesTotal)
{
    if (m_currentIndex >= 0 && m_currentIndex < m_uploadQueue.size()) {
        int progress = static_cast<int>((bytesSent * 100) / bytesTotal);
        updateItemProgress(m_currentIndex, progress);
        
        // Calculate overall progress
        int totalProgress = 0;
        for (int i = 0; i < m_uploadQueue.size(); ++i) {
            if (i < m_currentIndex) {
                totalProgress += 100;
            } else if (i == m_currentIndex) {
                totalProgress += progress;
            }
        }
        totalProgress /= m_uploadQueue.size();
        emit uploadProgress(totalProgress);
    }
}

void UploadManager::onUploadFinished()
{
    if (!m_currentReply) {
        return;
    }
    
    if (m_currentReply->error() == QNetworkReply::NoError) {
        // Upload successful
        if (m_currentIndex >= 0 && m_currentIndex < m_uploadQueue.size()) {
            updateItemStatus(m_currentIndex, "Completed");
            updateItemProgress(m_currentIndex, 100);
            
            // Close and cleanup file
            UploadItem &item = m_uploadQueue[m_currentIndex];
            if (item.file) {
                item.file->close();
                delete item.file;
                item.file = nullptr;
            }
        }
        
        m_currentRetries = 0;
        m_currentIndex++;
        
        // Process next upload
        QTimer::singleShot(100, this, &UploadManager::processNextUpload);
    } else {
        // Upload failed
        if (m_currentRetries < m_maxRetries) {
            m_currentRetries++;
            updateItemStatus(m_currentIndex, QString("Retrying... (%1/%2)").arg(m_currentRetries).arg(m_maxRetries));
            
            // Retry after delay
            m_retryTimer->start(2000 * m_currentRetries); // Exponential backoff
        } else {
            updateItemStatus(m_currentIndex, "Failed");
            m_currentRetries = 0;
            m_currentIndex++;
            
            // Process next upload
            QTimer::singleShot(100, this, &UploadManager::processNextUpload);
        }
    }
    
    m_currentReply->deleteLater();
    m_currentReply = nullptr;
}

void UploadManager::onNetworkError(QNetworkReply::NetworkError error)
{
    if (m_currentReply) {
        emit uploadError(QString("Network error: %1").arg(m_currentReply->errorString()));
    }
}

void UploadManager::scanFolder(const QString &folderPath)
{
    QDirIterator it(folderPath, QDir::Files | QDir::NoDotAndDotDot, QDirIterator::Subdirectories);
    
    while (it.hasNext()) {
        QString filePath = it.next();
        QFileInfo fileInfo(filePath);
        
        // Only add media files
        QStringList mediaExtensions = {".mp4", ".avi", ".mov", ".mkv", ".mp3", ".wav", ".flac", ".jpg", ".jpeg", ".png", ".gif", ".bmp"};
        if (mediaExtensions.contains(fileInfo.suffix().toLower())) {
            UploadItem item(filePath);
            m_uploadQueue.enqueue(item);
        }
    }
}

void UploadManager::createMultipartRequest(const UploadItem &item)
{
    if (!item.file || !item.file->isOpen()) {
        return;
    }
    
    // Create multipart request
    QHttpMultiPart *multiPart = new QHttpMultiPart(QHttpMultiPart::FormDataType);
    
    // Add file part
    QHttpPart filePart;
    filePart.setHeader(QNetworkRequest::ContentTypeHeader, QVariant("application/octet-stream"));
    filePart.setHeader(QNetworkRequest::ContentDispositionHeader, 
                      QVariant(QString("form-data; name=\"file\"; filename=\"%1\"").arg(item.fileName)));
    
    // Read file data
    QByteArray fileData = item.file->readAll();
    filePart.setBody(fileData);
    multiPart->append(filePart);
    
    // Add metadata
    QHttpPart metadataPart;
    metadataPart.setHeader(QNetworkRequest::ContentDispositionHeader, QVariant("form-data; name=\"metadata\""));
    
    QJsonObject metadata;
    metadata["fileName"] = item.fileName;
    metadata["fileSize"] = static_cast<qint64>(item.fileSize);
    metadata["originalPath"] = item.filePath;
    
    QJsonDocument metadataDoc(metadata);
    metadataPart.setBody(metadataDoc.toJson());
    multiPart->append(metadataPart);
    
    // Create request
    QUrl uploadUrl(m_serverUrl);
    uploadUrl.setPath("/api/v1/media/upload");
    
    QNetworkRequest request(uploadUrl);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "multipart/form-data");
    
    if (!m_authToken.isEmpty()) {
        request.setRawHeader("Authorization", QString("Bearer %1").arg(m_authToken).toUtf8());
    }
    
    // Send request
    m_currentReply = m_networkManager->post(request, multiPart);
    multiPart->setParent(m_currentReply); // Set parent for cleanup
    
    connect(m_currentReply, &QNetworkReply::uploadProgress, this, &UploadManager::onUploadProgress);
    connect(m_currentReply, &QNetworkReply::finished, this, &UploadManager::onUploadFinished);
    connect(m_currentReply, QOverload<QNetworkReply::NetworkError>::of(&QNetworkReply::errorOccurred),
            this, &UploadManager::onNetworkError);
}

void UploadManager::updateItemProgress(int index, int progress)
{
    if (index >= 0 && index < m_uploadQueue.size()) {
        m_uploadQueue[index].progress = progress;
        emit itemProgressChanged(index, progress);
    }
}

void UploadManager::updateItemStatus(int index, const QString &status)
{
    if (index >= 0 && index < m_uploadQueue.size()) {
        m_uploadQueue[index].status = status;
        emit itemStatusChanged(index, status);
    }
}
