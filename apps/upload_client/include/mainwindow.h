#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QTreeView>
#include <QPushButton>
#include <QProgressBar>
#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QSplitter>
#include <QFileSystemModel>
#include <QStandardItemModel>
#include <QMenuBar>
#include <QStatusBar>
#include <QSettings>
#include <QTimer>
#include <QNetworkAccessManager>
#include <QAuthenticator>
#include <QNetworkReply>

class AuthDialog;
class UploadManager;
class FolderSync;
class NetworkManager;

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

private slots:
    void onLoginClicked();
    void onLogoutClicked();
    void onAddFolderClicked();
    void onRemoveFolderClicked();
    void onSyncAllClicked();
    void onUploadClicked();
    void onAuthenticationChanged(bool authenticated);
    void onUploadProgress(int progress);
    void onSyncProgress(int progress);
    void onStatusMessage(const QString &message);
    void onNetworkError(const QString &error);

private:
    void setupUI();
    void setupMenuBar();
    void setupStatusBar();
    void setupConnections();
    void loadSettings();
    void saveSettings();
    void updateAuthenticationState();
    void refreshFolderList();

    // UI Components
    QWidget *m_centralWidget;
    QVBoxLayout *m_mainLayout;
    QSplitter *m_splitter;
    
    // Left panel - Local folders
    QWidget *m_leftPanel;
    QVBoxLayout *m_leftLayout;
    QLabel *m_localFoldersLabel;
    QTreeView *m_localFoldersView;
    QFileSystemModel *m_fileSystemModel;
    QPushButton *m_addFolderBtn;
    QPushButton *m_removeFolderBtn;
    
    // Right panel - Upload queue and status
    QWidget *m_rightPanel;
    QVBoxLayout *m_rightLayout;
    QLabel *m_uploadQueueLabel;
    QTreeView *m_uploadQueueView;
    QStandardItemModel *m_uploadQueueModel;
    QPushButton *m_uploadBtn;
    QPushButton *m_syncAllBtn;
    QProgressBar *m_uploadProgressBar;
    QProgressBar *m_syncProgressBar;
    
    // Authentication
    QPushButton *m_loginBtn;
    QPushButton *m_logoutBtn;
    QLabel *m_userLabel;
    
    // Core components
    AuthDialog *m_authDialog;
    UploadManager *m_uploadManager;
    FolderSync *m_folderSync;
    NetworkManager *m_networkManager;
    
    // State
    bool m_isAuthenticated;
    QString m_currentUser;
    QString m_authToken;
    QStringList m_syncedFolders;
    
    // Settings
    QSettings *m_settings;
    
    // Timer for periodic sync
    QTimer *m_syncTimer;
};

#endif // MAINWINDOW_H
