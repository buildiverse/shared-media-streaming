#ifndef NETWORKMANAGER_H
#define NETWORKMANAGER_H

#include <QObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QNetworkRequest>
#include <QUrl>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QTimer>
#include <QMutex>

class NetworkManager : public QObject
{
    Q_OBJECT

public:
    explicit NetworkManager(QObject *parent = nullptr);
    ~NetworkManager();
    
    void setAuthToken(const QString &token);
    void setServerUrl(const QString &url);
    void setTimeout(int timeout);
    
    // HTTP methods
    QNetworkReply* get(const QString &endpoint, const QJsonObject &params = QJsonObject());
    QNetworkReply* post(const QString &endpoint, const QJsonObject &data);
    QNetworkReply* put(const QString &endpoint, const QJsonObject &data);
    QNetworkReply* deleteResource(const QString &endpoint);
    
    // File upload
    QNetworkReply* uploadFile(const QString &endpoint, const QString &filePath, const QJsonObject &metadata = QJsonObject());
    
    // Utility methods
    bool isOnline() const;
    QString getLastError() const;
    void clearLastError();

signals:
    void networkError(const QString &error);
    void connectionStatusChanged(bool online);
    void requestStarted(const QString &endpoint);
    void requestFinished(const QString &endpoint, bool success);

private slots:
    void onNetworkReplyFinished();
    void onNetworkError(QNetworkReply::NetworkError error);
    void onTimeout();

private:
    void setupRequest(QNetworkRequest &request, const QString &endpoint);
    QUrl buildUrl(const QString &endpoint, const QJsonObject &params = QJsonObject());
    void handleNetworkError(QNetworkReply::NetworkError error, const QString &endpoint);
    void trackRequest(QNetworkReply *reply, const QString &endpoint);
    
    // Network
    QNetworkAccessManager *m_networkManager;
    QString m_authToken;
    QString m_serverUrl;
    int m_timeout;
    
    // State
    bool m_isOnline;
    QString m_lastError;
    QMutex m_errorMutex;
    
    // Request tracking
    QHash<QNetworkReply*, QString> m_activeRequests;
    QHash<QNetworkReply*, QTimer*> m_requestTimers;
};

#endif // NETWORKMANAGER_H
