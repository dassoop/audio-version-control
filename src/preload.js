const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('api', {
    req: (req) => ipcRenderer.invoke('req', req)
})

ipcRenderer.on('res', (event, res) => { 
    switch(res.resType) 
    {
      case '':
          
        break;
      default:     
    }
})