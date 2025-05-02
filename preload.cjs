/* eslint-disable no-undef */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      const validChannels = [
        'choose-source-folder',
        'choose-destination-folder',
        'search-beatmaps',
        'move-beatmaps'
      ]
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data)
      }
    },
    on: (channel, func) => {
      const validChannels = [
        'source-folder-selected',
        'destination-folder-selected',
        'beatmaps-found',
        'beatmaps-moved',
        'beatmaps-progress',
        'error'
      ]
      if (validChannels.includes(channel)) {
        // Usuwamy stare nasłuchiwacze, aby uniknąć duplikacji
        ipcRenderer.removeAllListeners(channel)
        ipcRenderer.on(channel, (event, ...args) => func(...args))
      }
    }
  }
})
