/* eslint-disable no-undef */
const { app, BrowserWindow, ipcMain, dialog, session } = require('electron')
const path = require('path')
const { createReadStream } = require('fs')
const { createInterface } = require('readline')
const glob = require('glob')
const { dirname } = require('path')
const { rename, mkdir } = require('fs/promises')
const process = require('node:process')

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

  // Otwórz narzędzia deweloperskie w trybie deweloperskim
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.webContents.openDevTools()
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
    // Znajdź wszystkie pliki .osu rekurencyjnie
    const osuFiles = await glob('**/*.osu', { cwd: folderPath, absolute: true })
    
    // Mapa do śledzenia folderów beatmap (aby uniknąć duplikatów)
    const beatmapFolders = new Map()
    
    // Mapa do grupowania beatmap wg folderu i tytułu+artysta
    const uniqueBeatmaps = new Map()
    
    // Przetwarzamy każdy plik .osu
    const beatmapsPromises = osuFiles.map(async (osuFilePath) => {
      try {
        const folderPath = dirname(osuFilePath)
        
        // Jeśli folder już był przetworzony, pomijamy plik
        if (beatmapFolders.has(folderPath)) {
          return null
        }
        
        // Parsujemy metadane pliku .osu
        const metadata = await parseOsuFile(osuFilePath)
        if (!metadata) return null
        
        // Dodajemy folder do mapy przetworzonych folderów
        beatmapFolders.set(folderPath, true)
        
        // Tworzymy unikalny klucz dla beatmapy - artysta + tytuł + folder
        const beatmapKey = `${metadata.artist}_${metadata.title}_${folderPath}`
        
        // Jeśli mapa z takim kluczem już istnieje, pomijamy
        if (uniqueBeatmaps.has(beatmapKey)) {
          return null
        }
        
        const beatmap = {
          id: folderPath, // Używamy ścieżki folderu jako unikalnego ID
          path: folderPath,
          osuFile: osuFilePath,
          ...metadata
        }
        
        // Dodajemy mapę do naszej kolekcji unikalnych beatmap
        uniqueBeatmaps.set(beatmapKey, beatmap)
        
        return beatmap
      } catch (error) {
        console.error(`Błąd przy przetwarzaniu pliku ${osuFilePath}:`, error)
        return null
      }
    })
    
    // Czekamy na zakończenie wszystkich operacji parsowania
    const beatmapsWithNulls = await Promise.all(beatmapsPromises)
    
    // Filtrujemy nullowe wyniki i sortujemy po artyście
    const beatmaps = beatmapsWithNulls
      .filter(beatmap => beatmap !== null)
      .sort((a, b) => a.artist.localeCompare(b.artist))
    
    return beatmaps
  } catch (error) {
    console.error('Błąd przy wyszukiwaniu beatmap:', error)
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

// Funkcja przenosząca beatmapy do wybranego folderu
async function moveBeatmaps(beatmapIds, destinationFolder) {
  try {
    const moved = []
    
    for (const beatmapId of beatmapIds) {
      const sourceFolderPath = beatmapId
      const folderName = path.basename(sourceFolderPath)
      const destinationPath = path.join(destinationFolder, folderName)
      
      // Utwórz folder docelowy, jeśli nie istnieje
      try {
        await mkdir(destinationPath, { recursive: true })
      } catch (error) {
        // Ignoruj błąd, jeśli folder już istnieje
        if (error.code !== 'EEXIST') {
          throw error
        }
      }
      
      // Znajdź wszystkie pliki w folderze źródłowym
      const files = await glob('*', { cwd: sourceFolderPath, absolute: true })
      
      // Przenieś każdy plik do folderu docelowego
      for (const file of files) {
        const fileName = path.basename(file)
        const destination = path.join(destinationPath, fileName)
        await rename(file, destination)
      }
      
      moved.push(beatmapId)
    }
    
    return moved
  } catch (error) {
    console.error('Błąd przy przenoszeniu beatmap:', error)
    throw error
  }
}
