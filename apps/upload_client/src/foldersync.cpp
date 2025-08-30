#include "foldersync.h"
#include <QDirIterator>
#include <QHttpMultiPart>
#include <QHttpPart>
#include <QJsonDocument>
#include <QJsonObject>
#include <QSettings>
#include <QApplication>
#include <QStandardPaths>
#include <QFileDialog>
#include <QDateTime>

FolderSync::FolderSync(QObject *parent)
    : QObject(parent)
    , m_fileWatcher(nullptr)
    , m_currentReply(nullptr)
    , m_isSyncing(false)
    , m_isEnabled(false)
    , m_syncInterval(300000) // 5 minutes
    , m_maxRetries(3)
    , m_currentRetries(0)
{
    m_fileWatcher = new QFileSystemWatcher(this);
    m_networkManager = new QNetworkAccessManager(this);
    m_syncTimer = new QTimer(this);
    
    // Initialize media file extensions
    m_mediaExtensions = {".mp4", ".avi", ".mov", ".mkv", ".mp3", ".wav", ".flac", 
                        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"};
    
    // Initialize ignored patterns
    m_ignoredPatterns = {"*.tmp", "*.temp", "*.cache", "*.log", "Thumbs.db", ".DS_Store"};
    
    // Setup timer
    m_syncTimer->setInterval(m_syncInterval);
    connect(m_syncTimer, &QTimer::timeout, this, &FolderSync::onSyncTimeout);
    
    // Setup file watcher connections
    connect(m_fileWatcher, &QFileSystemWatcher::fileChanged, this, &FolderSync::onFileChanged);
    connect(m_fileWatcher, &QFileSystemWatcher::directoryChanged, this, &FolderSync::onDirectoryChanged);
    
    // Load settings
    QSettings settings;
    m_serverUrl = settings.value("sync/serverUrl", "http://localhost:3000").toString();
    m_syncInterval = settings.value("sync/interval", 300000).toInt();
    m_maxRetries = settings.value("sync/maxRetries", 3).toInt();
    
    m_syncTimer->setInterval(m_syncInterval);
}

FolderSync::~FolderSync()
{
    stopSync();
    
    if (m_fileWatcher) {
        m_fileWatcher->removePaths(m_fileWatcher->directories());
        m_fileWatcher->removePaths(m_fileWatcher->files());
    }
}

void FolderSync::setAuthToken(const QString &token)
{
    m_authToken = token;
}

void FolderSync::setServerUrl(const QString &url)
{
    m_serverUrl = url;
    
    // Save to settings
    QSettings settings;
    settings.setValue("sync/serverUrl", url);
}

void FolderSync::addFolder(const QString &folderPath)
{
    QMutexLocker locker(&m_syncMutex);
    
    QDir dir(folderPath);
    if (!dir.exists() || m_watchedFolders.contains(folderPath)) {
        return;
    }
    
    // Add to watched folders
    m_watchedFolders.append(folderPath);
    m_fileWatcher->addPath(folderPath);
    
    // Scan folder for existing files
    scanFolder(folderPath);
    
    // Watch subdirectories
    QDirIterator it(folderPath, QDir::Dirs | QDir::NoDotAndDotDot, QDirIterator::Subdirectories);
    while (it.hasNext()) {
        QString subDir = it.next();
        m_fileWatcher->addPath(subDir);
    }
    
    emit folderAdded(folderPath);
    
    // Save to settings
    QSettings settings;
    QStringList folders = settings.value("sync/folders").toStringList();
    if (!folders.contains(folderPath)) {
        folders.append(folderPath);
        settings.setValue("sync/folders", folders);
    }
}

void FolderSync::removeFolder(const QString &folderPath)
{
    QMutexLocker locker(&m_syncMutex);
    
    if (!m_watchedFolders.contains(folderPath)) {
        return;
    }
    
    // Remove from watched folders
    m_watchedFolders.removeOne(folderPath);
    m_fileWatcher->removePath(folderPath);
    
    // Remove subdirectories
    QDirIterator it(folderPath, QDir::Dirs | QDir::NoDotAndDotDot, QDirIterator::Subdirectories);
    while (it.hasNext()) {
        QString subDir = it.next();
        m_fileWatcher->removePath(subDir);
    }
    
    // Remove items from sync queue
    for (int i = m_syncQueue.size() - 1; i >= 0; --i) {
        if (m_syncQueue[i].localPath.startsWith(folderPath)) {
            m_syncQueue.removeAt(i);
        }
    }
    
    // Remove from file index
    QStringList keysToRemove;
    for (auto it = m_fileIndex.begin(); it != m_fileIndex.end(); ++it) {
        if (it.value().localPath.startsWith(folderPath)) {
            keysToRemove.append(it.key());
        }
    }
    for (const QString &key : keysToRemove) {
        m_fileIndex.remove(key);
    }
    
    emit folderRemoved(folderPath);
    
    // Save to settings
    QSettings settings;
    QStringList folders = settings.value("sync/folders").toStringList();
    folders.removeOne(folderPath);
    settings.setValue("sync/folders", folders);
}

void FolderSync::startSync()
{
    if (m_isEnabled) {
        return;
    }
    
    m_isEnabled = true;
    m_syncTimer->start();
    
    // Load saved folders
    QSettings settings;
    QStringList folders = settings.value("sync/folders").toStringList();
    for (const QString &folder : folders) {
        if (QDir(folder).exists()) {
            addFolder(folder);
        }
    }
    
    // Start initial sync
    forceSync();
}

void FolderSync::stopSync()
{
    m_isEnabled = false;
    m_syncTimer->stop();
    
    if (m_isSyncing) {
        if (m_currentReply) {
            m_currentReply->abort();
        }
        m_isSyncing = false;
    }
}

void FolderSync::forceSync()
{
    if (m_isSyncing) {
        return;
    }
    
    updateSyncQueue();
    processSyncQueue();
}

QStringList FolderSync::getSyncedFolders() const
{
    return m_watchedFolders;
}

QList<SyncItem> FolderSync::getSyncQueue() const
{
    QMutexLocker locker(const_cast<QMutex*>(&m_syncMutex));
    return m_syncQueue;
}

bool FolderSync::isSyncing() const
{
    return m_isSyncing;
}

void FolderSync::onFileChanged(const QString &path)
{
    if (!m_isEnabled) {
        return;
    }
    
    // Check if it's a media file
    QFileInfo fileInfo(path);
    if (fileInfo.exists() && fileInfo.isFile()) {
        QString extension = fileInfo.suffix().toLower();
        if (m_mediaExtensions.contains("." + extension)) {
            scanFile(path);
        }
    }
}

void FolderSync::onDirectoryChanged(const QString &path)
{
    if (!m_isEnabled) {
        return;
    }
    
    // Add new subdirectories to watcher
    QDir dir(path);
    QDirIterator it(path, QDir::Dirs | QDir::NoDotAndDotDot);
    while (it.hasNext()) {
        QString subDir = it.next();
        if (!m_fileWatcher->directories().contains(subDir)) {
            m_fileWatcher->addPath(subDir);
        }
    }
    
    // Scan for new files
    scanFolder(path);
}

void FolderSync::onSyncTimeout()
{
    if (m_isEnabled && !m_isSyncing) {
        forceSync();
    }
}

void FolderSync::onNetworkReplyFinished()
{
    if (!m_currentReply) {
        return;
    }
    
    if (m_currentReply->error() == QNetworkReply::NoError) {
        // Sync successful
        m_currentRetries = 0;
    } else {
        // Sync failed
        if (m_currentRetries < m_maxRetries) {
            m_currentRetries++;
            // Retry after delay
            QTimer::singleShot(2000 * m_currentRetries, this, &FolderSync::processSyncQueue);
        } else {
            m_currentRetries = 0;
            emit syncError(QString("Sync failed after %1 retries").arg(m_maxRetries));
        }
    }
    
    m_currentReply->deleteLater();
    m_currentReply = nullptr;
    m_isSyncing = false;
    
    // Continue processing queue
    processSyncQueue();
}

void FolderSync::scanFolder(const QString &folderPath)
{
    QDirIterator it(folderPath, QDir::Files | QDir::NoDotAndDotDot, QDirIterator::Subdirectories);
    
    while (it.hasNext()) {
        QString filePath = it.next();
        scanFile(filePath);
    }
}

void FolderSync::scanFile(const QString &filePath)
{
    QMutexLocker locker(&m_syncMutex);
    
    QFileInfo fileInfo(filePath);
    if (!fileInfo.exists() || !fileInfo.isFile()) {
        return;
    }
    
    // Check if it's a media file
    QString extension = fileInfo.suffix().toLower();
    if (!m_mediaExtensions.contains("." + extension)) {
        return;
    }
    
    // Check if file is already in index
    if (m_fileIndex.contains(filePath)) {
        SyncItem &existingItem = m_fileIndex[filePath];
        
        // Check if file has changed
        if (existingItem.lastModified != fileInfo.lastModified() || 
            existingItem.fileSize != fileInfo.size()) {
            existingItem.lastModified = fileInfo.lastModified();
            existingItem.fileSize = fileInfo.size();
            existingItem.status = "Modified";
            
            // Add to sync queue if not already there
            bool inQueue = false;
            for (const SyncItem &item : m_syncQueue) {
                if (item.localPath == filePath) {
                    inQueue = true;
                    break;
                }
            }
            if (!inQueue) {
                m_syncQueue.append(existingItem);
            }
        }
    } else {
        // New file
        SyncItem newItem(filePath);
        m_fileIndex[filePath] = newItem;
        m_syncQueue.append(newItem);
    }
}

void FolderSync::updateSyncQueue()
{
    // This method would check for deleted files and update the queue accordingly
    // Implementation depends on specific requirements
}

void FolderSync::processSyncQueue()
{
    if (m_isSyncing || m_syncQueue.isEmpty()) {
        if (m_syncQueue.isEmpty()) {
            emit syncFinished();
        }
        return;
    }
    
    QMutexLocker locker(&m_syncMutex);
    
    // Find next item to sync
    SyncItem *nextItem = nullptr;
    for (int i = 0; i < m_syncQueue.size(); ++i) {
        if (m_syncQueue[i].status == "Pending" || m_syncQueue[i].status == "Modified") {
            nextItem = &m_syncQueue[i];
            break;
        }
    }
    
    if (!nextItem) {
        emit syncFinished();
        return;
    }
    
    m_isSyncing = true;
    nextItem->status = "Syncing";
    
    if (nextItem->isDirectory) {
        createDirectory(*nextItem);
    } else {
        uploadFile(*nextItem);
    }
    
    emit itemStatusChanged(m_syncQueue.indexOf(*nextItem), "Syncing");
}

void FolderSync::uploadFile(const SyncItem &item)
{
    if (!QFile::exists(item.localPath)) {
        updateItemStatus(m_syncQueue.indexOf(item), "File not found");
        return;
    }
    
    // Create multipart request
    QHttpMultiPart *multiPart = new QHttpMultiPart(QHttpMultiPart::FormDataType);
    
    // Add file part
    QHttpPart filePart;
    filePart.setHeader(QNetworkRequest::ContentTypeHeader, QVariant("application/octet-stream"));
    filePart.setHeader(QNetworkRequest::ContentDispositionHeader, 
                      QVariant(QString("form-data; name=\"file\"; filename=\"%1\"").arg(item.fileName)));
    
    QFile file(item.localPath);
    if (file.open(QIODevice::ReadOnly)) {
        filePart.setBody(file.readAll());
        file.close();
    }
    multiPart->append(filePart);
    
    // Add metadata
    QHttpPart metadataPart;
    metadataPart.setHeader(QNetworkRequest::ContentDispositionHeader, QVariant("form-data; name=\"metadata\""));
    
    QJsonObject metadata;
    metadata["fileName"] = item.fileName;
    metadata["fileSize"] = static_cast<qint64>(item.fileSize);
    metadata["originalPath"] = item.localPath;
    metadata["lastModified"] = item.lastModified.toString(Qt::ISODate);
    
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
    multiPart->setParent(m_currentReply);
    
    connect(m_currentReply, &QNetworkReply::finished, this, &FolderSync::onNetworkReplyFinished);
}

void FolderSync::createDirectory(const SyncItem &item)
{
    // Create directory on server
    QUrl createDirUrl(m_serverUrl);
    createDirUrl.setPath("/api/v1/media/create-directory");
    
    QNetworkRequest request(createDirUrl);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    if (!m_authToken.isEmpty()) {
        request.setRawHeader("Authorization", QString("Bearer %1").arg(m_authToken).toUtf8());
    }
    
    QJsonObject dirData;
    dirData["name"] = item.fileName;
    dirData["path"] = item.remotePath;
    
    QJsonDocument doc(dirData);
    QByteArray data = doc.toJson();
    
    m_currentReply = m_networkManager->post(request, data);
    
    connect(m_currentReply, &QNetworkReply::finished, this, &FolderSync::onNetworkReplyFinished);
}

void FolderSync::removeRemoteItem(const SyncItem &item)
{
    // Remove item from server
    QUrl removeUrl(m_serverUrl);
    removeUrl.setPath("/api/v1/media/remove");
    
    QNetworkRequest request(removeUrl);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    if (!m_authToken.isEmpty()) {
        request.setRawHeader("Authorization", QString("Bearer %1").arg(m_authToken).toUtf8());
    }
    
    QJsonObject removeData;
    removeData["path"] = item.remotePath;
    
    QJsonDocument doc(removeData);
    QByteArray data = doc.toJson();
    
    m_currentReply = m_networkManager->post(request, data);
    
    connect(m_currentReply, &QNetworkReply::finished, this, &FolderSync::onNetworkReplyFinished);
}

void FolderSync::updateItemStatus(int index, const QString &status)
{
    if (index >= 0 && index < m_syncQueue.size()) {
        m_syncQueue[index].status = status;
        emit itemStatusChanged(index, status);
    }
}
