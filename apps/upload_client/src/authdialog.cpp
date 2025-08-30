#include "authdialog.h"
#include <QSettings>
#include <QMessageBox>
#include <QApplication>
#include <QStandardPaths>
#include <QDir>
#include <QUrlQuery>
#include <QJsonParseError>

AuthDialog::AuthDialog(QWidget *parent)
    : QDialog(parent)
    , m_currentReply(nullptr)
    , m_isLoading(false)
{
    setupUI();
    setupConnections();
    
    // Load saved settings
    QSettings settings;
    m_serverUrlEdit->setText(settings.value("auth/serverUrl", "http://localhost:3000").toString());
    m_usernameEdit->setText(settings.value("auth/username").toString());
    m_rememberMeCheck->setChecked(settings.value("auth/rememberMe", false).toBool());
    
    // Initialize network manager
    m_networkManager = new QNetworkAccessManager(this);
    
    setWindowTitle("Login - Upload Client");
    setModal(true);
    resize(400, 300);
}

QString AuthDialog::getAuthToken() const
{
    return m_authToken;
}

QString AuthDialog::getUsername() const
{
    return m_username;
}

void AuthDialog::setupUI()
{
    QVBoxLayout *mainLayout = new QVBoxLayout(this);
    
    // Title
    QLabel *titleLabel = new QLabel("Login to Shared Media Streaming");
    titleLabel->setStyleSheet("font-size: 16px; font-weight: bold; margin: 10px;");
    titleLabel->setAlignment(Qt::AlignCenter);
    mainLayout->addWidget(titleLabel);
    
    // Form
    QFormLayout *formLayout = new QFormLayout();
    
    m_serverUrlEdit = new QLineEdit();
    m_serverUrlEdit->setPlaceholderText("http://localhost:3000");
    formLayout->addRow("Server URL:", m_serverUrlEdit);
    
    m_usernameEdit = new QLineEdit();
    m_usernameEdit->setPlaceholderText("Enter username");
    formLayout->addRow("Username:", m_usernameEdit);
    
    m_passwordEdit = new QLineEdit();
    m_passwordEdit->setPlaceholderText("Enter password");
    m_passwordEdit->setEchoMode(QLineEdit::Password);
    formLayout->addRow("Password:", m_passwordEdit);
    
    mainLayout->addLayout(formLayout);
    
    // Remember me checkbox
    m_rememberMeCheck = new QCheckBox("Remember me");
    mainLayout->addWidget(m_rememberMeCheck);
    
    // Status label
    m_statusLabel = new QLabel();
    m_statusLabel->setStyleSheet("color: red; margin: 5px;");
    m_statusLabel->setVisible(false);
    mainLayout->addWidget(m_statusLabel);
    
    // Buttons
    QHBoxLayout *buttonLayout = new QHBoxLayout();
    
    m_loginBtn = new QPushButton("Login");
    m_loginBtn->setDefault(true);
    
    m_cancelBtn = new QPushButton("Cancel");
    
    buttonLayout->addWidget(m_loginBtn);
    buttonLayout->addWidget(m_cancelBtn);
    
    mainLayout->addLayout(buttonLayout);
    
    // Set focus to username field
    m_usernameEdit->setFocus();
}

void AuthDialog::setupConnections()
{
    connect(m_loginBtn, &QPushButton::clicked, this, &AuthDialog::onLoginClicked);
    connect(m_cancelBtn, &QPushButton::clicked, this, &QDialog::reject);
    
    // Enter key in password field triggers login
    connect(m_passwordEdit, &QLineEdit::returnPressed, this, &AuthDialog::onLoginClicked);
}

void AuthDialog::onLoginClicked()
{
    if (m_isLoading) {
        return;
    }
    
    QString username = m_usernameEdit->text().trimmed();
    QString password = m_passwordEdit->text();
    QString serverUrl = m_serverUrlEdit->text().trimmed();
    
    if (username.isEmpty() || password.isEmpty() || serverUrl.isEmpty()) {
        showError("Please fill in all fields");
        return;
    }
    
    // Validate server URL
    QUrl url(serverUrl);
    if (!url.isValid() || url.scheme().isEmpty()) {
        showError("Please enter a valid server URL");
        return;
    }
    
    setLoadingState(true);
    showError(""); // Clear any previous errors
    
    // Prepare login request
    QUrl loginUrl(url);
    loginUrl.setPath("/api/v1/auth/login");
    
    QNetworkRequest request(loginUrl);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    QJsonObject loginData;
    loginData["username"] = username;
    loginData["password"] = password;
    
    QJsonDocument doc(loginData);
    QByteArray data = doc.toJson();
    
    // Send login request
    m_currentReply = m_networkManager->post(request, data);
    
    connect(m_currentReply, &QNetworkReply::finished, this, &AuthDialog::onLoginFinished);
    connect(m_currentReply, QOverload<QNetworkReply::NetworkError>::of(&QNetworkReply::errorOccurred),
            this, &AuthDialog::onNetworkError);
}

void AuthDialog::onLoginFinished()
{
    if (!m_currentReply) {
        return;
    }
    
    setLoadingState(false);
    
    if (m_currentReply->error() == QNetworkReply::NoError) {
        QByteArray responseData = m_currentReply->readAll();
        QJsonParseError parseError;
        QJsonDocument responseDoc = QJsonDocument::fromJson(responseData, &parseError);
        
        if (parseError.error == QJsonParseError::NoError) {
            QJsonObject response = responseDoc.object();
            
            // Check for success and data structure
            if (response.contains("success") && response["success"].toBool()) {
                if (response.contains("data")) {
                    QJsonObject data = response["data"].toObject();
                    
                    if (data.contains("accessToken")) {
                        m_authToken = data["accessToken"].toString();
                        m_username = m_usernameEdit->text().trimmed();
                        
                        // Save settings if remember me is checked
                        if (m_rememberMeCheck->isChecked()) {
                            QSettings settings;
                            settings.setValue("auth/serverUrl", m_serverUrlEdit->text().trimmed());
                            settings.setValue("auth/username", m_username);
                            settings.setValue("auth/rememberMe", true);
                        }
                        
                        accept();
                        return;
                    } else {
                        showError("No access token in response");
                    }
                } else {
                    showError("No data in response");
                }
            } else if (response.contains("message")) {
                showError(response["message"].toString());
            } else {
                showError("Invalid response from server");
            }
        } else {
            showError("Failed to parse server response");
        }
    } else {
        showError("Network error: " + m_currentReply->errorString());
    }
    
    m_currentReply->deleteLater();
    m_currentReply = nullptr;
}

void AuthDialog::onNetworkError(QNetworkReply::NetworkError error)
{
    if (m_currentReply) {
        showError("Network error: " + m_currentReply->errorString());
        m_currentReply->deleteLater();
        m_currentReply = nullptr;
    }
    setLoadingState(false);
}

void AuthDialog::setLoadingState(bool loading)
{
    m_isLoading = loading;
    m_loginBtn->setEnabled(!loading);
    m_usernameEdit->setEnabled(!loading);
    m_passwordEdit->setEnabled(!loading);
    m_serverUrlEdit->setEnabled(!loading);
    m_rememberMeCheck->setEnabled(!loading);
    
    if (loading) {
        m_loginBtn->setText("Logging in...");
        m_statusLabel->setText("Connecting to server...");
        m_statusLabel->setVisible(true);
    } else {
        m_loginBtn->setText("Login");
    }
}

void AuthDialog::showError(const QString &error)
{
    if (error.isEmpty()) {
        m_statusLabel->setVisible(false);
    } else {
        m_statusLabel->setText(error);
        m_statusLabel->setVisible(true);
    }
}
