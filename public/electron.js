const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// More reliable way to detect development environment
// Check if app is packaged - if it's packaged, it's production
const isPackaged = app.isPackaged;
const isDev = !isPackaged && (
  process.env.NODE_ENV === 'development' || 
  process.env.ELECTRON_IS_DEV === 'true' || 
  (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath))
);

console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  ELECTRON_IS_DEV: process.env.ELECTRON_IS_DEV,
  defaultApp: process.defaultApp,
  execPath: process.execPath,
  isPackaged: isPackaged,
  isDev: isDev
});

// Keep a global reference of the window object
let mainWindow;

// Enable live reload for Electron in development
if (isDev) {
  try {
    const electronReload = require('electron-reload');
    electronReload(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (e) {
    console.log('electron-reload not available in production');
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Minimal 3D Studio',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // Disable web security for API calls
      allowRunningInsecureContent: true,
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false, // Don't show until ready
    titleBarStyle: 'default',
  });

  // Load the app
  let startUrl;
  let fallbackUrl;
  
  if (isDev) {
    startUrl = 'http://localhost:3000';
    // Fallback to local files if development server is not available
    const indexPath = path.join(app.getAppPath(), 'build', 'index.html');
    fallbackUrl = pathToFileURL(indexPath).href;
  } else {
    // Properly construct file:// URL using Node.js built-in method
    const indexPath = path.join(app.getAppPath(), 'build', 'index.html');
    startUrl = pathToFileURL(indexPath).href;
    fallbackUrl = null;
    
    // Check if the file exists
    const fs = require('fs');
    const fileExists = fs.existsSync(indexPath);
    console.log('Production mode - checking file:', indexPath);
    console.log('File exists:', fileExists);
    
    if (!fileExists) {
      console.error('Build file not found! App path:', app.getAppPath());
      console.error('Looking for:', indexPath);
      
      // List contents of app directory
      try {
        const appPath = app.getAppPath();
        const contents = fs.readdirSync(appPath);
        console.log('App directory contents:', contents);
        
        // Check if build directory exists
        const buildPath = path.join(appPath, 'build');
        const buildExists = fs.existsSync(buildPath);
        console.log('Build directory exists:', buildExists);
        
        if (buildExists) {
          const buildContents = fs.readdirSync(buildPath);
          console.log('Build directory contents:', buildContents);
        }
      } catch (err) {
        console.error('Error checking directories:', err);
      }
    }
  }
  
  console.log('Loading URL:', startUrl);
  if (fallbackUrl) {
    console.log('Fallback URL:', fallbackUrl);
  }
  
  // Load the URL with error handling and fallback
  const loadWithFallback = async (url, fallback = null) => {
    try {
      await mainWindow.loadURL(url);
      console.log('Successfully loaded:', url);
    } catch (err) {
      console.error('Failed to load URL:', url, err);
      
      if (fallback) {
        console.log('Attempting fallback URL:', fallback);
        try {
          await mainWindow.loadURL(fallback);
          console.log('Successfully loaded fallback:', fallback);
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
          dialog.showErrorBox('Loading Error', 
            `Failed to load the application:\n\nPrimary URL: ${url}\nError: ${err.message}\n\nFallback URL: ${fallback}\nFallback Error: ${fallbackErr.message}`);
        }
      } else {
        dialog.showErrorBox('Loading Error', `Failed to load the application:\n${err.message}`);
      }
    }
  };
  
  loadWithFallback(startUrl, fallbackUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
  });

    // Additional event handlers for monitoring
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Page finished loading successfully');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Page failed to load:', { errorCode, errorDescription, validatedURL });
    
    // Open DevTools for debugging in production if there's an error
    if (!isDev && (errorCode === -6 || errorCode === -3)) { // FILE_NOT_FOUND or ABORTED
      console.log('Opening DevTools for debugging...');
      mainWindow.webContents.openDevTools();
    }
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set up menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Handle network errors gracefully
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors (for API calls)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.includes('tripo3d.ai')) {
    // Allow certificates from tripo3d.ai
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
}); 