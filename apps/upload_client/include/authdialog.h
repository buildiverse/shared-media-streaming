#ifndef AUTHDIALOG_H
#define AUTHDIALOG_H

#include <QDialog>
#include <QLineEdit>
#include <QPushButton>
#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QFormLayout>
#include <QCheckBox>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonObject>

class AuthDialog : public QDialog
{
    Q_OBJECT

public:
    explicit AuthDialog(QWidget *parent = nullptr);
    QString getAuthToken() const;
    QString getUsername() const;

private slots:
    void onLoginClicked();
    void onLoginFinished();
    void onNetworkError(QNetworkReply::NetworkError error);

private:
    void setupUI();
    void setupConnections();
    void setLoadingState(bool loading);
    void showError(const QString &error);

    // UI Components
    QLineEdit *m_usernameEdit;
    QLineEdit *m_passwordEdit;
    QLineEdit *m_serverUrlEdit;
    QPushButton *m_loginBtn;
    QPushButton *m_cancelBtn;
    QCheckBox *m_rememberMeCheck;
    QLabel *m_statusLabel;
    
    // Network
    QNetworkAccessManager *m_networkManager;
    QNetworkReply *m_currentReply;
    
    // State
    QString m_authToken;
    QString m_username;
    bool m_isLoading;
};

#endif // AUTHDIALOG_H
