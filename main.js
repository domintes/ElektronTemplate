/* eslint-disable no-undef */
const { app, BrowserWindow, ipcMain, dialog, session } = require('electron')
const path = require('path')
const fs = require('fs')
const { createReadStream } = require('fs')
const { createInterface } = require('readline')
const { glob } = require('glob')
const { dirname } = require('path')
const { rename, mkdir } = require('fs/promises')
const process = require('node:process')

// Enable Windows long path support
if (process.platform === 'win32') {
  process.env.ELECTRON_ENABLE_LONG_PATH_SUPPORT = 'true';
}

// Główne okno aplikacji
let mainWindow

function createWindow() {
  // Bardziej liberalna polityka CSP dla aplikacji lokalnej
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws:;"
        ]
      }
    })
  })

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: true,     // Włączamy integrację z Node.js
      sandbox: false,            // Wyłączamy sandbox
      webSecurity: false,        // Wyłączamy webSecurity dla aplikacji lokalnej
    },
  })

  // W trybie produkcyjnym ładuj plik HTML wygenerowany przez Vite
  // W trybie deweloperskim łącz się z serwerem deweloperskim Vite
  if (process.env.NODE_ENV === 'production') {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
  } else {
    // Spróbuj najpierw port 3001 (Vite może używać tego portu, jeśli 3000 jest zajęty)
    const port = process.env.VITE_DEV_SERVER_PORT || 3001
    mainWindow.loadURL(`http://localhost:${port}`)
    
    // W przypadku błędu spróbuj port 3000
    mainWindow.webContents.on('did-fail-load', () => {
      console.log(`Nie udało się załadować http://localhost:${port}, próbuję port 3000...`)
      mainWindow.loadURL('http://localhost:3000')
    })
  }

}

// Inicjalizacja aplikacji po gotowości Electron
app.whenReady().then(() => {
  createWindow()

  // MacOS - specyficzne zachowanie
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
  
  // Skonfiguruj obsługę IPC
  setupIpcHandlers()
})

// Zamknij aplikację, gdy wszystkie okna są zamknięte (z wyjątkiem macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Obsługa komunikacji IPC między React a Electron
function setupIpcHandlers() {
  // Wybór folderu źródłowego
  ipcMain.on('choose-source-folder', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Wybierz folder z beatmapami Osu!',
      })

      if (!result.canceled && result.filePaths.length > 0) {
        mainWindow.webContents.send('source-folder-selected', result.filePaths[0])
      }
    } catch (error) {
      mainWindow.webContents.send('error', `Błąd przy wyborze folderu: ${error.message}`)
    }
  })

  // Wybór folderu docelowego
  ipcMain.on('choose-destination-folder', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Wybierz folder docelowy dla beatmap',
      })

      if (!result.canceled && result.filePaths.length > 0) {
        mainWindow.webContents.send('destination-folder-selected', result.filePaths[0])
      }
    } catch (error) {
      mainWindow.webContents.send('error', `Błąd przy wyborze folderu: ${error.message}`)
    }
  })

  // Wyszukiwanie beatmap w folderze
  ipcMain.on('search-beatmaps', async (_, sourceFolder) => {
    try {
      const beatmaps = await findBeatmaps(sourceFolder)
      mainWindow.webContents.send('beatmaps-found', { beatmaps })
    } catch (error) {
      mainWindow.webContents.send('error', `Błąd przy wyszukiwaniu beatmap: ${error.message}`)
    }
  })

  // Przenoszenie beatmap do innego folderu
  ipcMain.on('move-beatmaps', async (_, data) => {
    try {
      const { beatmapIds, destinationFolder } = data
      const moved = await moveBeatmaps(beatmapIds, destinationFolder)
      mainWindow.webContents.send('beatmaps-moved', {
        moved: moved.length,
        destination: destinationFolder
      })
    } catch (error) {
      mainWindow.webContents.send('error', `Błąd przy przenoszeniu beatmap: ${error.message}`)
    }
  })
}

// Funkcja znajdująca wszystkie pliki .osu w folderze i odczytująca ich metadane
async function findBeatmaps(folderPath) {
  try {
    // Ustaw timeout na 5 minut dla bardzo dużych folderów
    const timeout = setTimeout(() => {
      throw new Error('Przekroczono limit czasu wyszukiwania (5 minut). Folder może być zbyt duży lub zawierać zbyt wiele plików.')
    }, 5 * 60 * 1000)

    let totalFiles = 0
    let processedFiles = 0
    let lastProgressUpdate = Date.now()
    const PROGRESS_UPDATE_INTERVAL = 1000 // 1 sekunda

    // Updated glob options - removed conflicting options
    const globOptions = { 
      cwd: folderPath,
      nocase: true, // Case-insensitive search
      dot: true,    // Include hidden files
      windowsPathsNoEscape: true // Better Windows path handling
    }

    // Get all .osu files
    const files = await glob('**/*.osu', globOptions)
    
    totalFiles = files.length
    if (totalFiles === 0) {
      clearTimeout(timeout)
      return []
    }

    // Mapa do śledzenia folderów beatmap
    const beatmapFolders = new Map()
    const uniqueBeatmaps = new Map()
    const errors = []

    // Convert relative paths to absolute
    const osuFiles = files.map(file => path.resolve(folderPath, file))

    // Przetwarzanie plików partiami
    const BATCH_SIZE = 50
    let beatmaps = []

    for (let i = 0; i < osuFiles.length; i += BATCH_SIZE) {
      const batch = osuFiles.slice(i, i + BATCH_SIZE)
      const beatmapsBatch = await Promise.all(batch.map(async (osuFilePath) => {
        try {
          const folderPath = dirname(osuFilePath)
          if (beatmapFolders.has(folderPath)) return null

          // Handle long paths
          if (osuFilePath.length > 255) {
            console.warn(`Długa ścieżka pliku (${osuFilePath.length} znaków): ${osuFilePath}`)
            // Try to use relative path if absolute is too long
            const relativePath = path.relative(path.dirname(folderPath), osuFilePath)
            if (relativePath.length <= 255) {
              osuFilePath = path.resolve(folderPath, relativePath)
            } else {
              throw new Error(`Ścieżka pliku jest za długa (${osuFilePath.length} znaków). Spróbuj przenieść pliki do katalogu o krótszej nazwie.`)
            }
          }

          const metadata = await parseOsuFile(osuFilePath)
          if (!metadata) return null

          beatmapFolders.set(folderPath, true)
          const beatmapKey = `${metadata.artist}_${metadata.title}_${folderPath}`
          
          if (uniqueBeatmaps.has(beatmapKey)) return null

          const beatmap = {
            id: folderPath,
            path: folderPath,
            osuFile: osuFilePath,
            ...metadata
          }
          uniqueBeatmaps.set(beatmapKey, beatmap)
          return beatmap
        } catch (error) {
          errors.push(`Błąd przy przetwarzaniu ${osuFilePath}: ${error.message}`)
          return null
        }
      }))

      beatmaps = beatmaps.concat(beatmapsBatch.filter(b => b !== null))
      processedFiles += batch.length

      // Aktualizuj postęp nie częściej niż co sekundę
      const now = Date.now()
      if (now - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('beatmaps-progress', {
            loaded: processedFiles,
            total: totalFiles,
            errors: errors.length > 0 ? errors : undefined
          })
        }
        lastProgressUpdate = now
      }
    }

    clearTimeout(timeout)

    // Raportuj błędy na końcu
    if (errors.length > 0) {
      console.warn(`Znaleziono ${errors.length} błędów podczas wyszukiwania:`)
      errors.forEach(err => console.warn(err))
    }

    return beatmaps.sort((a, b) => a.artist.localeCompare(b.artist))
  } catch (error) {
    console.error('Błąd przy wyszukiwaniu beatmap:', error)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('error', `Błąd przy wyszukiwaniu beatmap: ${error.message}`)
    }
    throw error
  }
}

// Funkcja parsująca plik .osu, aby wyodrębnić metadane
async function parseOsuFile(filePath) {
  try {
    const fileStream = createReadStream(filePath)
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    })
    
    const metadata = {
      artist: '',
      title: '',
      creator: '',
      version: '',
      bpm: 0,
      totalTime: 0
    }
    
    let inMetadataSection = false
    let inTimingPointsSection = false
    let inHitObjectsSection = false
    
    const timingPoints = []
    let firstHitObject = null
    let lastHitObject = null
    
    for await (const line of rl) {
      // Sprawdzamy sekcję pliku
      if (line.startsWith('[Metadata]')) {
        inMetadataSection = true
        continue
      } else if (line.startsWith('[')) {
        inMetadataSection = false
      }
      
      if (line.startsWith('[TimingPoints]')) {
        inTimingPointsSection = true
        continue
      } else if (line.startsWith('[')) {
        inTimingPointsSection = false
      }
      
      if (line.startsWith('[HitObjects]')) {
        inHitObjectsSection = true
        continue
      } else if (line.startsWith('[')) {
        inHitObjectsSection = false
      }
      
      // Parsowanie sekcji metadanych
      if (inMetadataSection) {
        if (line.startsWith('Artist:')) {
          metadata.artist = line.substring(7).trim()
        } else if (line.startsWith('Title:')) {
          metadata.title = line.substring(6).trim()
        } else if (line.startsWith('Creator:')) {
          metadata.creator = line.substring(8).trim()
        } else if (line.startsWith('Version:')) {
          metadata.version = line.substring(8).trim()
        }
      }
      
      // Parsowanie timing points do obliczenia BPM
      if (inTimingPointsSection && !line.startsWith('[') && line.trim() !== '') {
        const parts = line.split(',')
        if (parts.length >= 2) {
          const time = parseFloat(parts[0])
          const beatLength = parseFloat(parts[1])
          
          // Jeśli beatLength > 0, to jest to timing point (nie inherited point)
          if (beatLength > 0) {
            timingPoints.push({ time, beatLength })
          }
        }
      }
      
      // Parsowanie HitObjects do obliczenia długości utworu
      if (inHitObjectsSection && !line.startsWith('[') && line.trim() !== '') {
        const parts = line.split(',')
        if (parts.length >= 3) {
          const time = parseInt(parts[2], 10)
          
          if (firstHitObject === null || time < firstHitObject) {
            firstHitObject = time
          }
          
          if (lastHitObject === null || time > lastHitObject) {
            lastHitObject = time
          }
        }
      }
    }
    
    fileStream.close()
    
    // Obliczamy BPM na podstawie pierwszego timing point (jeśli istnieje)
    if (timingPoints.length > 0) {
      const firstTimingPoint = timingPoints[0]
      metadata.bpm = Math.round(60000 / firstTimingPoint.beatLength)
    }
    
    // Obliczamy całkowitą długość utworu w sekundach
    if (firstHitObject !== null && lastHitObject !== null) {
      metadata.totalTime = Math.round((lastHitObject - firstHitObject) / 1000)
    }
    
    return metadata
  } catch (error) {
    console.error(`Błąd przy parsowaniu pliku ${filePath}:`, error)
    return null
  }
}

// Funkcja do usuwania pustych katalogów
async function removeEmptyDir(dirPath, sourceFolderPath) {
  try {
    // Odczytaj zawartość katalogu
    const files = await glob('*', { cwd: dirPath, absolute: true });
    if (files.length === 0) {
      // Sprawdź, czy to nie jest główny katalog beatmap przed usunięciem
      const parentDir = path.dirname(dirPath);
      const isBeatmapRoot = sourceFolderPath === parentDir;
      if (!isBeatmapRoot) {
        await fs.promises.rmdir(dirPath);
        console.log(`Usunięto pusty katalog: ${dirPath}`);
      }
    }
  } catch (error) {
    console.error(`Błąd przy usuwaniu katalogu ${dirPath}:`, error);
  }
}

// Funkcja przenosząca beatmapy do wybranego folderu
async function moveBeatmaps(beatmapIds, destinationFolder) {
  try {
    const moved = [];
    
    for (const beatmapId of beatmapIds) {
      const sourceFolderPath = beatmapId;
      const folderName = path.basename(sourceFolderPath);
      const destinationPath = path.join(destinationFolder, folderName);
      
      // Przenieś cały folder beatmap zamiast pojedynczych plików
      try {
        // Utwórz folder docelowy, jeśli nie istnieje
        await mkdir(path.dirname(destinationPath), { recursive: true });
        
        // Przenieś cały folder
        await rename(sourceFolderPath, destinationPath);
        console.log(`Przeniesiono folder z ${sourceFolderPath} do ${destinationPath}`);
        
        // Wyczyść puste foldery nadrzędne po przeniesieniu
        const parentDir = path.dirname(sourceFolderPath);
        await removeEmptyDir(parentDir, sourceFolderPath);
        
        moved.push(beatmapId);
      } catch (error) {
        console.error(`Błąd przy przenoszeniu beatmapy ${sourceFolderPath}:`, error);
        throw error;
      }
    }
    
    return moved;
  } catch (error) {
    console.error('Błąd przy przenoszeniu beatmap:', error);
    throw error;
  }
}
