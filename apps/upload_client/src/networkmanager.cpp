#include "networkmanager.h"
#include <QHttpMultiPart>
#include <QHttpPart>
#include <QFile>
#include <QFileInfo>
#include <QSettings>
#include <QApplication>
#include <QStandardPaths>
#include <QDir>
#include <QUrlQuery>
#include <QJsonParseError>

NetworkManager::NetworkManager(QObject *parent)
    : QObject(parent)
    , m_networkManager(nullptr)
    , m_timeout(30000) // 30 seconds default
    , m_isOnline(true)
{
    m_networkManager = new QNetworkAccessManager(this);
    
    // Load settings
    QSettings settings;
    m_serverUrl = settings.value("network/serverUrl", "http://localhost:3000").toString();
    m_timeout = settings.value("network/timeout", 30000).toInt();
    
    // Connect network manager signals
    // Note: networkAccessibleChanged was removed in Qt6
    // Network status will be determined by actual request results
}

NetworkManager::~NetworkManager()
{
    // Cancel all active requests
    for (auto it = m_activeRequests.begin(); it != m_activeRequests.end(); ++it) {
        if (it.key()) {
            it.key()->abort();
        }
    }
    
    // Stop all timers
    for (auto it = m_requestTimers.begin(); it != m_requestTimers.end(); ++it) {
        if (it.value()) {
            it.value()->stop();
        }
    }
}

void NetworkManager::setAuthToken(const QString &token)
{
    m_authToken = token;
}

void NetworkManager::setServerUrl(const QString &url)
{
    m_serverUrl = url;
    
    // Save to settings
    QSettings settings;
    settings.setValue("network/serverUrl", url);
}

void NetworkManager::setTimeout(int timeout)
{
    m_timeout = timeout;
    
    // Save to settings
    QSettings settings;
    settings.setValue("network/timeout", timeout);
}

QNetworkReply* NetworkManager::get(const QString &endpoint, const QJsonObject &params)
{
    QUrl url = buildUrl(endpoint, params);
    QNetworkRequest request(url);
    
    setupRequest(request, endpoint);
    
    QNetworkReply *reply = m_networkManager->get(request);
    trackRequest(reply, endpoint);
    
    emit requestStarted(endpoint);
    return reply;
}

QNetworkReply* NetworkManager::post(const QString &endpoint, const QJsonObject &data)
{
    QUrl url = buildUrl(endpoint);
    QNetworkRequest request(url);
    
    setupRequest(request, endpoint);
    
    QJsonDocument doc(data);
    QByteArray jsonData = doc.toJson();
    
    QNetworkReply *reply = m_networkManager->post(request, jsonData);
    trackRequest(reply, endpoint);
    
    emit requestStarted(endpoint);
    return reply;
}

QNetworkReply* NetworkManager::put(const QString &endpoint, const QJsonObject &data)
{
    QUrl url = buildUrl(endpoint);
    QNetworkRequest request(url);
    
    setupRequest(request, endpoint);
    
    QJsonDocument doc(data);
    QByteArray jsonData = doc.toJson();
    
    QNetworkReply *reply = m_networkManager->put(request, jsonData);
    trackRequest(reply, endpoint);
    
    emit requestStarted(endpoint);
    return reply;
}

QNetworkReply* NetworkManager::deleteResource(const QString &endpoint)
{
    QUrl url = buildUrl(endpoint);
    QNetworkRequest request(url);
    
    setupRequest(request, endpoint);
    
    QNetworkReply *reply = m_networkManager->deleteResource(request);
    trackRequest(reply, endpoint);
    
    emit requestStarted(endpoint);
    return reply;
}

QNetworkReply* NetworkManager::uploadFile(const QString &endpoint, const QString &filePath, const QJsonObject &metadata)
{
    QFileInfo fileInfo(filePath);
    if (!fileInfo.exists() || !fileInfo.isFile()) {
        QMutexLocker locker(&m_errorMutex);
        m_lastError = QString("File does not exist: %1").arg(filePath);
        emit networkError(m_lastError);
        return nullptr;
    }
    
    QUrl url = buildUrl(endpoint);
    QNetworkRequest request(url);
    
    setupRequest(request, endpoint);
    
    // Create multipart request
    QHttpMultiPart *multiPart = new QHttpMultiPart(QHttpMultiPart::FormDataType);
    
    // Add file part
    QHttpPart filePart;
    filePart.setHeader(QNetworkRequest::ContentTypeHeader, QVariant("application/octet-stream"));
    filePart.setHeader(QNetworkRequest::ContentDispositionHeader, 
                      QVariant(QString("form-data; name=\"file\"; filename=\"%1\"").arg(fileInfo.fileName())));
    
    QFile file(filePath);
    if (file.open(QIODevice::ReadOnly)) {
        filePart.setBody(file.readAll());
        file.close();
    } else {
        QMutexLocker locker(&m_errorMutex);
        m_lastError = QString("Cannot open file: %1").arg(filePath);
        emit networkError(m_lastError);
        delete multiPart;
        return nullptr;
    }
    multiPart->append(filePart);
    
    // Add metadata if provided
    if (!metadata.isEmpty()) {
        QHttpPart metadataPart;
        metadataPart.setHeader(QNetworkRequest::ContentDispositionHeader, QVariant("form-data; name=\"metadata\""));
        
        QJsonDocument metadataDoc(metadata);
        metadataPart.setBody(metadataDoc.toJson());
        multiPart->append(metadataPart);
    }
    
    // Send request
    QNetworkReply *reply = m_networkManager->post(request, multiPart);
    multiPart->setParent(reply); // Set parent for cleanup
    
    trackRequest(reply, endpoint);
    
    emit requestStarted(endpoint);
    return reply;
}

bool NetworkManager::isOnline() const
{
    return m_isOnline;
}

QString NetworkManager::getLastError() const
{
    QMutexLocker locker(const_cast<QMutex*>(&m_errorMutex));
    return m_lastError;
}

void NetworkManager::clearLastError()
{
    QMutexLocker locker(&m_errorMutex);
    m_lastError.clear();
}

void NetworkManager::onNetworkReplyFinished()
{
    QNetworkReply *reply = qobject_cast<QNetworkReply*>(sender());
    if (!reply) {
        return;
    }
    
    QString endpoint = m_activeRequests.value(reply, "");
    bool success = (reply->error() == QNetworkReply::NoError);
    
    // Stop timer
    if (m_requestTimers.contains(reply)) {
        QTimer *timer = m_requestTimers[reply];
        timer->stop();
        timer->deleteLater();
        m_requestTimers.remove(reply);
    }
    
    // Remove from tracking
    m_activeRequests.remove(reply);
    
    emit requestFinished(endpoint, success);
    
    // Clean up reply
    reply->deleteLater();
}

void NetworkManager::onNetworkError(QNetworkReply::NetworkError error)
{
    QNetworkReply *reply = qobject_cast<QNetworkReply*>(sender());
    if (!reply) {
        return;
    }
    
    QString endpoint = m_activeRequests.value(reply, "");
    handleNetworkError(error, endpoint);
}

void NetworkManager::onTimeout()
{
    QTimer *timer = qobject_cast<QTimer*>(sender());
    if (!timer) {
        return;
    }
    
    // Find the reply associated with this timer
    QNetworkReply *reply = nullptr;
    for (auto it = m_requestTimers.begin(); it != m_requestTimers.end(); ++it) {
        if (it.value() == timer) {
            reply = it.key();
            break;
        }
    }
    
    if (reply) {
        QString endpoint = m_activeRequests.value(reply, "");
        
        // Abort the request
        reply->abort();
        
        // Handle timeout error
        QMutexLocker locker(&m_errorMutex);
        m_lastError = QString("Request timeout for endpoint: %1").arg(endpoint);
        emit networkError(m_lastError);
        
        // Clean up
        m_requestTimers.remove(reply);
        m_activeRequests.remove(reply);
        reply->deleteLater();
        timer->deleteLater();
    }
}

void NetworkManager::setupRequest(QNetworkRequest &request, const QString &endpoint)
{
    // Set headers
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    request.setHeader(QNetworkRequest::UserAgentHeader, "UploadClient/1.0");
    
    // Add authorization header if token is available
    if (!m_authToken.isEmpty()) {
        request.setRawHeader("Authorization", QString("Bearer %1").arg(m_authToken).toUtf8());
    }
    
    // Set timeout
    request.setTransferTimeout(m_timeout);
}

QUrl NetworkManager::buildUrl(const QString &endpoint, const QJsonObject &params)
{
    QUrl url(m_serverUrl);
    
    // Add endpoint path
    if (!endpoint.startsWith("/")) {
        url.setPath(url.path() + "/" + endpoint);
    } else {
        url.setPath(url.path() + endpoint);
    }
    
    // Add query parameters
    if (!params.isEmpty()) {
        QUrlQuery query;
        for (auto it = params.begin(); it != params.end(); ++it) {
            query.addQueryItem(it.key(), it.value().toString());
        }
        url.setQuery(query);
    }
    
    return url;
}

void NetworkManager::handleNetworkError(QNetworkReply::NetworkError error, const QString &endpoint)
{
    QString errorString;
    
    switch (error) {
        case QNetworkReply::ConnectionRefusedError:
            errorString = "Connection refused";
            break;
        case QNetworkReply::RemoteHostClosedError:
            errorString = "Remote host closed connection";
            break;
        case QNetworkReply::HostNotFoundError:
            errorString = "Host not found";
            break;
        case QNetworkReply::TimeoutError:
            errorString = "Request timeout";
            break;
        case QNetworkReply::OperationCanceledError:
            errorString = "Operation canceled";
            break;
        case QNetworkReply::SslHandshakeFailedError:
            errorString = "SSL handshake failed";
            break;
        case QNetworkReply::TemporaryNetworkFailureError:
            errorString = "Temporary network failure";
            break;
        case QNetworkReply::NetworkSessionFailedError:
            errorString = "Network session failed";
            break;
        case QNetworkReply::BackgroundRequestNotAllowedError:
            errorString = "Background request not allowed";
            break;
        case QNetworkReply::TooManyRedirectsError:
            errorString = "Too many redirects";
            break;
        case QNetworkReply::InsecureRedirectError:
            errorString = "Insecure redirect";
            break;
        case QNetworkReply::InternalServerError:
            errorString = "Internal server error";
            break;
        case QNetworkReply::OperationNotImplementedError:
            errorString = "Operation not implemented";
            break;
        case QNetworkReply::ServiceUnavailableError:
            errorString = "Service unavailable";
            break;
        case QNetworkReply::ProtocolUnknownError:
            errorString = "Protocol unknown";
            break;
        case QNetworkReply::ProtocolInvalidOperationError:
            errorString = "Protocol invalid operation";
            break;
        case QNetworkReply::UnknownNetworkError:
            errorString = "Unknown network error";
            break;
        case QNetworkReply::UnknownProxyError:
            errorString = "Unknown proxy error";
            break;
        case QNetworkReply::UnknownContentError:
            errorString = "Unknown content error";
            break;
        case QNetworkReply::ProtocolFailure:
            errorString = "Protocol failure";
            break;
        default:
            errorString = "Network error occurred";
            break;
    }
    
    if (!endpoint.isEmpty()) {
        errorString += QString(" for endpoint: %1").arg(endpoint);
    }
    
    QMutexLocker locker(&m_errorMutex);
    m_lastError = errorString;
    emit networkError(errorString);
}

void NetworkManager::trackRequest(QNetworkReply *reply, const QString &endpoint)
{
    if (!reply) {
        return;
    }
    
    // Track the request
    m_activeRequests[reply] = endpoint;
    
    // Setup timeout timer
    QTimer *timer = new QTimer(this);
    timer->setSingleShot(true);
    timer->setInterval(m_timeout);
    
    connect(timer, &QTimer::timeout, this, &NetworkManager::onTimeout);
    m_requestTimers[reply] = timer;
    
    // Start timer
    timer->start();
    
    // Connect reply signals
    connect(reply, &QNetworkReply::finished, this, &NetworkManager::onNetworkReplyFinished);
    connect(reply, QOverload<QNetworkReply::NetworkError>::of(&QNetworkReply::errorOccurred),
            this, &NetworkManager::onNetworkError);
}
