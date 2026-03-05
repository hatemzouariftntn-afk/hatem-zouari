const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const isDev = !app.isPackaged;

// Setup logging for production
if (!isDev) {
  const logPath = path.join(app.getPath('userData'), 'app.log');
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });
  
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = (...args) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    logStream.write(`[LOG ${new Date().toISOString()}] ${message}\n`);
    originalLog(...args);
  };
  
  console.error = (...args) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    logStream.write(`[ERROR ${new Date().toISOString()}] ${message}\n`);
    originalError(...args);
  };
  
  console.log('=== Application Started ===');
  console.log('Log file:', logPath);
}

// Single instance lock to prevent multiple windows
if (!app.requestSingleInstanceLock()) {
  app.quit();
  return;
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

let mainWindow;
let serverProcess;

function waitForPort(port, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const socket = net.connect(port, 'localhost', () => {
        clearInterval(interval);
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error(`Server not ready on port ${port}`));
        }
      });
    }, 500);
  });
}

async function createWindow() {
  // Get icon path - more robust way
  const iconPath = path.join(app.getAppPath(), 'assets', 'icon.ico');
  
  console.log('Icon path:', iconPath);
  console.log('Icon exists:', fs.existsSync(iconPath));

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Document Archiver",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // Don't show until ready
    icon: iconPath,
  });

  // Remove menu bar in production
  if (!isDev) {
    mainWindow.setMenuBarVisibility(false);
  }

  // Set user agent to mimic a standard browser
  mainWindow.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Add load event listeners for debugging
  mainWindow.webContents.on('did-start-loading', () => console.log('Started loading'));
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Finished loading');
    mainWindow.show(); // Show window after load
  });
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Load failed:', errorCode, errorDescription, validatedURL);
    mainWindow.show();
  });
  mainWindow.webContents.on('crashed', (event, exitCode) => {
    console.error('Renderer crashed:', exitCode);
  });

  // Log renderer console messages
  mainWindow.webContents.on('console-message', (event, level, message, lineNo, sourceId) => {
    console.log(`Renderer console [${level}]: ${message} (at ${sourceId}:${lineNo})`);
  });

  const port = isDev ? 3000 : 3001;

  if (isDev) {
    mainWindow.loadURL(`http://localhost:${port}`);
    mainWindow.webContents.openDevTools();
    mainWindow.show();
  } else {
    console.log('Starting production server...');
    // Start Next.js standalone server for packaged app
    const appPath = app.getAppPath();
    const standalonePath = path.join(appPath, '.next', 'standalone');
    const serverPath = path.join(standalonePath, 'server.js');
    const cwd = standalonePath; // Set cwd to standalone dir where public is copied
    console.log('App path:', appPath);
    console.log('Server path:', serverPath);
    console.log('CWD:', cwd);
    console.log('Standalone path exists:', require('fs').existsSync(standalonePath));
    console.log('Server.js exists:', require('fs').existsSync(serverPath));
    serverProcess = spawn('node', [serverPath], {
      cwd: cwd,
      env: { ...process.env, PORT: port, NODE_ENV: 'production' },
      stdio: 'pipe'
    });

    serverProcess.on('error', (err) => {
      console.error('Spawn error:', err);
    });

    serverProcess.on('close', (code) => {
      console.log(`Server closed with code ${code}`);
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server stdout: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server stderr: ${data}`);
    });

    try {
      await waitForPort(port);
      console.log('Server ready, loading URL');
      mainWindow.loadURL(`http://localhost:${port}`);
    } catch (error) {
      console.error('Failed to start server:', error);
      // Fallback to loading static file if server fails
      const fs = require('fs');
      const fallbackPath = path.join(standalonePath, 'index.html');
      console.log('Loading fallback:', fallbackPath);
      if (fs.existsSync(fallbackPath)) {
        mainWindow.loadFile(fallbackPath);
      } else {
        mainWindow.loadURL('data:text/html,<h1>Error: Server failed to start. Please restart the app.</h1>');
      }
    }
  }
}

app.whenReady().then(async () => {
  await createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
