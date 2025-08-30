#include "mainwindow.h"
#include "authdialog.h"
#include "uploadmanager.h"
#include "foldersync.h"
#include "networkmanager.h"
#include "settings.h"
#include <QFileDialog>
#include <QMessageBox>
#include <QApplication>
#include <QStandardPaths>
#include <QDir>
#include <QMenu>
#include <QAction>
#include <QInputDialog>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , m_isAuthenticated(false)
    , m_settings(nullptr)
    , m_syncTimer(nullptr)
{
    setupUI();
    setupMenuBar();
    setupStatusBar();
    setupConnections();
    
    // Initialize components
    m_authDialog = new AuthDialog(this);
    m_uploadManager = new UploadManager(this);
    m_folderSync = new FolderSync(this);
    m_networkManager = new NetworkManager(this);
    
    // Load settings
    loadSettings();
    
    // Setup periodic sync timer
    m_syncTimer = new QTimer(this);
    m_syncTimer->setInterval(300000); // 5 minutes
    connect(m_syncTimer, &QTimer::timeout, this, &MainWindow::onSyncAllClicked);
    
    // Update authentication state
    updateAuthenticationState();
    
    // Set window properties
    setWindowTitle("Upload Client - Shared Media Streaming");
    resize(1200, 800);
}

MainWindow::~MainWindow()
{
    saveSettings();
}

void MainWindow::setupUI()
{
    m_centralWidget = new QWidget(this);
    setCentralWidget(m_centralWidget);
    
    m_mainLayout = new QVBoxLayout(m_centralWidget);
    
    // Authentication bar
    QHBoxLayout *authLayout = new QHBoxLayout();
    m_loginBtn = new QPushButton("Login");
    m_logoutBtn = new QPushButton("Logout");
    m_userLabel = new QLabel("Not authenticated");
    m_logoutBtn->setEnabled(false);
    
    authLayout->addWidget(m_loginBtn);
    authLayout->addWidget(m_logoutBtn);
    authLayout->addWidget(m_userLabel);
    authLayout->addStretch();
    
    m_mainLayout->addLayout(authLayout);
    
    // Main splitter
    m_splitter = new QSplitter(Qt::Horizontal);
    
    // Left panel - Local folders
    m_leftPanel = new QWidget();
    m_leftLayout = new QVBoxLayout(m_leftPanel);
    
    m_localFoldersLabel = new QLabel("Local Folders");
    m_localFoldersLabel->setStyleSheet("font-weight: bold; font-size: 14px;");
    
    m_fileSystemModel = new QFileSystemModel(this);
    m_fileSystemModel->setRootPath(QDir::rootPath());
    
    m_localFoldersView = new QTreeView();
    m_localFoldersView->setModel(m_fileSystemModel);
    m_localFoldersView->setRootIndex(m_fileSystemModel->index(QDir::homePath()));
    m_localFoldersView->setSelectionMode(QAbstractItemView::ExtendedSelection);
    
    m_addFolderBtn = new QPushButton("Add Folder to Sync");
    m_removeFolderBtn = new QPushButton("Remove Folder");
    m_removeFolderBtn->setEnabled(false);
    
    m_leftLayout->addWidget(m_localFoldersLabel);
    m_leftLayout->addWidget(m_localFoldersView);
    
    QHBoxLayout *folderBtnLayout = new QHBoxLayout();
    folderBtnLayout->addWidget(m_addFolderBtn);
    folderBtnLayout->addWidget(m_removeFolderBtn);
    m_leftLayout->addLayout(folderBtnLayout);
    
    // Right panel - Upload queue and status
    m_rightPanel = new QWidget();
    m_rightLayout = new QVBoxLayout(m_rightPanel);
    
    m_uploadQueueLabel = new QLabel("Upload Queue");
    m_uploadQueueLabel->setStyleSheet("font-weight: bold; font-size: 14px;");
    
    m_uploadQueueModel = new QStandardItemModel(this);
    m_uploadQueueModel->setHorizontalHeaderLabels({"File", "Status", "Progress"});
    
    m_uploadQueueView = new QTreeView();
    m_uploadQueueView->setModel(m_uploadQueueModel);
    m_uploadQueueView->setSelectionMode(QAbstractItemView::SingleSelection);
    
    m_uploadBtn = new QPushButton("Upload Selected");
    m_syncAllBtn = new QPushButton("Sync All Folders");
    m_uploadProgressBar = new QProgressBar();
    m_syncProgressBar = new QProgressBar();
    
    m_uploadProgressBar->setVisible(false);
    m_syncProgressBar->setVisible(false);
    
    m_rightLayout->addWidget(m_uploadQueueLabel);
    m_rightLayout->addWidget(m_uploadQueueView);
    m_rightLayout->addWidget(m_uploadBtn);
    m_rightLayout->addWidget(m_syncAllBtn);
    m_rightLayout->addWidget(m_uploadProgressBar);
    m_rightLayout->addWidget(m_syncProgressBar);
    m_rightLayout->addStretch();
    
    // Add panels to splitter
    m_splitter->addWidget(m_leftPanel);
    m_splitter->addWidget(m_rightPanel);
    m_splitter->setSizes({600, 600});
    
    m_mainLayout->addWidget(m_splitter);
}

void MainWindow::setupMenuBar()
{
    QMenuBar *menuBar = this->menuBar();
    
    // File menu
    QMenu *fileMenu = menuBar->addMenu("&File");
    QAction *exitAction = fileMenu->addAction("E&xit");
    connect(exitAction, &QAction::triggered, this, &QWidget::close);
    
    // Tools menu
    QMenu *toolsMenu = menuBar->addMenu("&Tools");
    QAction *settingsAction = toolsMenu->addAction("&Settings");
    QAction *syncAction = toolsMenu->addAction("&Sync All");
    connect(syncAction, &QAction::triggered, this, &MainWindow::onSyncAllClicked);
    
    // Help menu
    QMenu *helpMenu = menuBar->addMenu("&Help");
    QAction *aboutAction = helpMenu->addAction("&About");
    connect(aboutAction, &QAction::triggered, [this]() {
        QMessageBox::about(this, "About Upload Client",
                          "Upload Client v1.0.0\n\n"
                          "A cross-platform desktop application for syncing and uploading "
                          "media files to the Shared Media Streaming platform.");
    });
}

void MainWindow::setupStatusBar()
{
    statusBar()->showMessage("Ready");
}

void MainWindow::setupConnections()
{
    connect(m_loginBtn, &QPushButton::clicked, this, &MainWindow::onLoginClicked);
    connect(m_logoutBtn, &QPushButton::clicked, this, &MainWindow::onLogoutClicked);
    connect(m_addFolderBtn, &QPushButton::clicked, this, &MainWindow::onAddFolderClicked);
    connect(m_removeFolderBtn, &QPushButton::clicked, this, &MainWindow::onRemoveFolderClicked);
    connect(m_syncAllBtn, &QPushButton::clicked, this, &MainWindow::onSyncAllClicked);
    connect(m_uploadBtn, &QPushButton::clicked, this, &MainWindow::onUploadClicked);
}

void MainWindow::loadSettings()
{
    m_settings = new QSettings(this);
    m_syncedFolders = m_settings->value("syncedFolders").toStringList();
    m_authToken = m_settings->value("authToken").toString();
    m_currentUser = m_settings->value("currentUser").toString();
    
    // Restore window geometry
    restoreGeometry(m_settings->value("geometry").toByteArray());
    restoreState(m_settings->value("windowState").toByteArray());
}

void MainWindow::saveSettings()
{
    if (m_settings) {
        m_settings->setValue("syncedFolders", m_syncedFolders);
        m_settings->setValue("authToken", m_authToken);
        m_settings->setValue("currentUser", m_currentUser);
        m_settings->setValue("geometry", saveGeometry());
        m_settings->setValue("windowState", saveState());
    }
}

void MainWindow::updateAuthenticationState()
{
    m_isAuthenticated = !m_authToken.isEmpty();
    
    m_loginBtn->setEnabled(!m_isAuthenticated);
    m_logoutBtn->setEnabled(m_isAuthenticated);
    m_userLabel->setText(m_isAuthenticated ? 
                        QString("Logged in as: %1").arg(m_currentUser) : 
                        "Not authenticated");
    
    m_addFolderBtn->setEnabled(m_isAuthenticated);
    m_syncAllBtn->setEnabled(m_isAuthenticated);
    m_uploadBtn->setEnabled(m_isAuthenticated);
    
    if (m_isAuthenticated) {
        m_syncTimer->start();
        statusBar()->showMessage("Authenticated and ready to sync");
    } else {
        m_syncTimer->stop();
        statusBar()->showMessage("Please login to start syncing");
    }
}

void MainWindow::refreshFolderList()
{
    // This would update the folder list display
    // Implementation depends on how you want to show synced folders
}

void MainWindow::onLoginClicked()
{
    if (m_authDialog->exec() == QDialog::Accepted) {
        m_authToken = m_authDialog->getAuthToken();
        m_currentUser = m_authDialog->getUsername();
        updateAuthenticationState();
        saveSettings();
    }
}

void MainWindow::onLogoutClicked()
{
    m_authToken.clear();
    m_currentUser.clear();
    m_syncedFolders.clear();
    updateAuthenticationState();
    saveSettings();
    
    // Clear upload queue
    m_uploadQueueModel->clear();
    m_uploadQueueModel->setHorizontalHeaderLabels({"File", "Status", "Progress"});
}

void MainWindow::onAddFolderClicked()
{
    QString folderPath = QFileDialog::getExistingDirectory(this, "Select Folder to Sync");
    if (!folderPath.isEmpty() && !m_syncedFolders.contains(folderPath)) {
        m_syncedFolders.append(folderPath);
        saveSettings();
        refreshFolderList();
        statusBar()->showMessage(QString("Added folder: %1").arg(folderPath));
    }
}

void MainWindow::onRemoveFolderClicked()
{
    // Implementation for removing folders
    // This would show a dialog to select which folder to remove
}

void MainWindow::onSyncAllClicked()
{
    if (m_syncedFolders.isEmpty()) {
        QMessageBox::information(this, "No Folders", "No folders are configured for syncing.");
        return;
    }
    
    m_syncProgressBar->setVisible(true);
    m_syncProgressBar->setValue(0);
    statusBar()->showMessage("Starting folder sync...");
    
    // This would trigger the folder sync process
    // Implementation depends on FolderSync class
}

void MainWindow::onUploadClicked()
{
    // Implementation for uploading selected files
    // This would process the upload queue
}

void MainWindow::onAuthenticationChanged(bool authenticated)
{
    m_isAuthenticated = authenticated;
    updateAuthenticationState();
}

void MainWindow::onUploadProgress(int progress)
{
    m_uploadProgressBar->setValue(progress);
    m_uploadProgressBar->setVisible(progress > 0 && progress < 100);
}

void MainWindow::onSyncProgress(int progress)
{
    m_syncProgressBar->setValue(progress);
    m_syncProgressBar->setVisible(progress > 0 && progress < 100);
}

void MainWindow::onStatusMessage(const QString &message)
{
    statusBar()->showMessage(message);
}

void MainWindow::onNetworkError(const QString &error)
{
    statusBar()->showMessage(QString("Error: %1").arg(error));
    QMessageBox::warning(this, "Network Error", error);
}
