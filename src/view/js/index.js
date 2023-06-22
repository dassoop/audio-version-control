var db
var selectedFile
var selectedFileCell
var playingFile = false
var starringFile = false
const params = new URLSearchParams(location.search)
var project = JSON.parse(params.get("project"))
var projectDir = project.dir
var projectName = project.name
var delimiter = project.delimiter
var userData = project.userData
const btnChooseFolder = document.getElementById('btn-chooseFolder')
const btnProjectSettings = document.getElementById('btn-project-settings')
const projectNameDisplay = document.getElementById('display-project-name')
const projectPathDisplay = document.getElementById('display-project-path')
const errorProject = document.getElementById('error-project')
const fileNameDisplay = document.getElementById('info-file-name')
const filePathDisplay = document.getElementById('info-file-path')
const audioPlayer = document.getElementById('audio-player')
const audioSource = document.getElementById('audio-source')
const fileTypeDisplay = document.getElementById('info-file-type')
const notesDisplay = document.getElementById('display-notes')
const noteInput = document.getElementById('form-notes-input')
const fileFormatDisplay = document.querySelector('.file-format-label')
const sampleRateDisplay = document.getElementById('info-file-sampleRate')
const bitDepthDisplay = document.getElementById('info-file-bitDepth')
const channelsDisplay = document.getElementById('info-file-channels')


projectNameDisplay.innerHTML = projectName
projectPathDisplay.innerHTML = projectDir

addListeners()
runAutoRender()
setInterval(runAutoRender, 10000)
function runAutoRender()
{
    autoRender()
}

async function autoRender()
{
    console.log('init')
    var data = await traverseDir()
    if(data.db == null)
    {
        errorProject.innerHTML = 'Project missing.'
    }
    else
    {
        errorProject.innerHTML = ''
        db = data.db
        render(db, data.delimiter)
    }
}

function traverseDir()
{
    return window.api.req({reqType: 'traverseDir', 
    data: 
    {
        projectDir: projectDir, 
        delimiter: delimiter,
        userData: userData
    }
})
}

function viewProjects()
{
    window.api.req({reqType: 'viewProjects', data: {}})
}

function render(data, delimiter)
{
    var output = ''

    const tableBody = document.getElementById('table-body')
    var output = ''
    var id = 0
    data.forEach((obj, objIndex, array) => {
        output += /*html*/
        `
            <tr class="table-row">
                <td>${obj.name}</td>
        `

        var concat = obj.name
        
        obj.userData.forEach((item, index, arr) => {
            var missingText = ''
            if(obj.missing == true)
            {
                missingText = ' (missing)'
            }
            else
            {
                missingText = ''
            }

            concat += delimiter + item
            if(index == obj.userData.length-1 || obj.userData.length == 0)
            {
                var starClass = 'fa-regular fa-star star btn-starFile'
                if(obj.starred == true)
                {
                    starClass = 'fa-solid fa-star star btn-starFile-selected'
                }
                output += /*html*/
                `
                    <td class="display-file" onmouseover="mouseOverFile(event)" onmouseleave="mouseLeaveFile(event)" onclick="clickFile(event)" ondblclick="playFile()" data-id=${id}>
                        <i class="fa-solid fa-play btn-playFile" onclick="playFile(event)"></i>
                        <span>${concat}${missingText}</span>
                        <i class="${starClass}" onclick="starFile(event)"></i>
                    </td>
                `
                id++
                //<i class="fa-solid fa-play"></i>
            }
            else
            {
                output += /*html*/
                `
                    <td>${concat}</td>
                `
            }
        })
        output += /*html*/
        `
            </tr>
        `
    })
    tableBody.innerHTML = output
    formatTable()
}

function formatTable()
{
    var table = document.getElementById("table");
    var row = table.rows[0]

    for (var i = 0; i < row.cells.length; i++) //loop through cells of first row to get columns 
    {
        var currText =''
        var border = '1px solid black'
        for(var j = 0; j < table.rows.length; j++) //loop down the rows of the column 
        {
            var style = ''
            
            if(i == row.cells.length-1)
            {
                style = 
                `
                    border: ${border}
                `
            }
            else
            {
                if(table.rows[j].cells[i].innerText != currText)
                {
                    currText = table.rows[j].cells[i].innerText
                    style = 
                    `
                        border-top: ${border};
                        border-left: ${border};
                        border-right: ${border};
                    `
                }
                else
                {
                    style = 
                    `
                        border-left: ${border};
                        border-right: ${border};
                        visibility: hidden; 
                    `
                }

                if(j == table.rows.length-1)
                {
                    style += 
                    `
                        border-bottom: ${border};    
                    `
                }
            }

            const cell = table.rows[j].cells[i]
            cell.style = style
        }
    }

    var fileDisplays = document.querySelectorAll('.display-file')
    fileDisplays.forEach((item, index, arr) => {
        if(item.getAttribute('data-id') == selectedFileCell)
        {
            item.style.backgroundColor = '#262626'
        }
    })
    console.log('finish render')
}

function openProjectSettings()
{
    window.api.req({reqType: 'openProjectSettings', data: {projectName: projectName}})
}

function mouseOverFile(e)
{
    e.currentTarget.style.backgroundColor = '#262626';
}

function mouseLeaveFile(e)
{
    if(e.currentTarget.getAttribute('data-id') == selectedFileCell)
    {
        e.currentTarget.style.backgroundColor = '#262626';
    }
    else
    {
        e.currentTarget.style.backgroundColor = '#1c1c1c';
    }
}

async function clickFile(e)
{
    currentTarget = e.currentTarget
    selectedFileCell = e.currentTarget.getAttribute('data-id')
    document.querySelectorAll('.display-file').forEach((item, index, arr) => {
        item.style.backgroundColor = '#1c1c1c'
    })
    if(selectedFileCell != null)
    {
        e.currentTarget.style.backgroundColor = '#262626'
    }
    var fileName = e.currentTarget.getElementsByTagName('span')[0].innerHTML
    var res = await window.api.req({reqType: 'getFile', data: {fileName: fileName, projectPath: projectDir}})
    selectedFile = res.data.file
    fileNameDisplay.innerHTML = selectedFile.filename
    filePathDisplay.innerHTML = selectedFile.path

    var audioTypes = ['wav', 'mp3', 'ogg']
    console.log(selectedFile.fileType)
    if(!audioTypes.includes(selectedFile.fileType))
    {
        fileFormatDisplay.style.display = 'none'
    }
    else
    {
        fileFormatDisplay.style.display = 'flex'
        console.log(fileFormatDisplay)
        getFileMetaData()
    }
    

    audioSource.src = selectedFile.path
    audioPlayer.load()
    if(playingFile == true)
    {
        audioPlayer.play()
        playingFile = false
    }
    if(starringFile == true)
    {
        var res = await window.api.req({reqType: 'starFile', data: {projectPath: projectDir, fileName: selectedFile.filename}})
        if(res.error != null) return console.log(res.error)
        if(res.data.starred == true)
        {
            currentTarget.querySelector('.star').className = 'fa-solid fa-star star btn-starFile-selected'
        }
        else
        {
            currentTarget.querySelector('.star').className = 'fa-regular fa-star star btn-starFile'
        }

        starringFile = false
    }
    fileTypeDisplay.innerHTML = selectedFile.fileType

    renderNotes(selectedFile.notes)
}

async function addNote()
{
    var noteText = noteInput.value
    if(selectedFile != null)
    {
        var res = await window.api.req({reqType: 'addNote', data: {projectPath: projectDir, fileName: selectedFile.filename, noteText: noteText}})
        var notes = res.data.file.notes
        selectedFile = res.data.file
        renderNotes(notes)
    }
}

async function clickNoteCheck(e)
{
    var index = e.currentTarget.getAttribute('data-index')
    selectedFile.notes[index].complete = e.currentTarget.checked
    var res = await window.api.req({reqType: 'updateNote', data: {projectPath: projectDir, fileName: selectedFile.filename, selectedFile: selectedFile}})
    db = res.data.db
}

async function deleteNote(e)
{
    var index = e.currentTarget.getAttribute('data-index')
    selectedFile.notes.splice(index, 1);
    var res = await window.api.req({reqType: 'updateNote', data: {projectPath: projectDir, fileName: selectedFile.filename, selectedFile: selectedFile}})
    db = res.data.db
    renderNotes(res.data.file.notes)
}

async function editNote(e)
{
    if (!e) e = window.event;
    var keyCode = e.code || e.key;
    if (keyCode == 'Enter')
    {
        e.preventDefault()
        e.currentTarget.blur()
    }
}

async function editNoteBlur(e)
{
    console.log('enter')
    // e.currentTarget.blur()
    var editedNotes = []
    document.querySelectorAll('.note-cell').forEach((item, index, arr) => {
        console.log(item)
        editedNotes.push(
            {
                complete: item.querySelector('input').checked,
                text: item.querySelector('p').innerHTML
            }
        ) //needs to push an object with the current "complete" boolean
    })
    selectedFile.notes = editedNotes
    var res = await window.api.req({reqType: 'updateNote', data: {projectPath: projectDir, fileName: selectedFile.filename, selectedFile: selectedFile}})
    console.log(res)
    db = res.data.db
    renderNotes(res.data.file.notes)
}

function renderNotes(notes)
{
    console.log(notes)
    output = ''
    index = 0

    notes.forEach((note) => {
        var checked = ''
        if(note.complete == true) checked += 'checked'
        output += /* html */ 
        `
            <div class="note-cell">
                <input class="note-checkbox" type="checkbox" data-index="${index}" onclick="clickNoteCheck(event)" ${checked}>
                <p class="note-text" contentEditable="true" data-index="${index}" onkeydown="editNote(event)" onblur="editNoteBlur(event)">${note.text}</p>
                <button class="note-delete" data-index="${index}" onclick="deleteNote(event)"><i class="fa-solid fa-x"></i></button>
            </div>
        `
        index++
    })

    notesDisplay.innerHTML = output
}

function playFile()
{
    playingFile = true
    console.log('play file')
}

function starFile()
{
    starringFile = true
    console.log('star file')
}

async function openDirInExplorer()
{
    if(projectDir != null)
    {
        var res = await window.api.req({reqType: 'openDirInExplorer', data: {path: projectDir}})
        if(res.error != null) return console.log(res.error)
        console.log(res)
    }
}

async function openFileInExplorer()
{
    if(selectedFile != null)
    {
        console.log(selectedFile)
        var res = await window.api.req({reqType: 'openFileInExplorer', data: {path: selectedFile.path}})
        if(res.error != null) return console.log(res.error)
        console.log(res)
    }
}

function addListeners()
{
    noteInput.addEventListener('keydown', (e) => {
        if (!e) e = window.event;
        var keyCode = e.code || e.key;
        if (keyCode == 'Enter')
        {
            addNote()
            noteInput.value = ''
        }
    }) 
}

async function exportFiles()
{
    var res = await window.api.req({reqType: 'exportFiles', body: {projectPath: projectDir}})
    if(res.error) return res.error
}

async function getFileMetaData()
{
    sampleRateDisplay.innerHTML = ''
    bitDepthDisplay.innerHTML = ''
    channelsDisplay.innerHTML = ''

    var res = await window.api.req(
        {
            reqType: 'getFileMetaData' 
            ,body: 
            {
                filePath: selectedFile.path
            }
        })
    if(res.error != null) return console.log(res.error)

    if(res.data.numberOfChannels > 2) 
        channelsDisplay.innerHTML = 'Surrounds'

    else if(res.data.numberOfChannels == 2) 
        channelsDisplay.innerHTML = 'Stereo'

    else 
        channelsDisplay.innerHTML = 'Mono'

    var sampleRate = res.data.sampleRate
    sampleRateDisplay.innerHTML = sampleRate

    bitDepthDisplay.innerHTML = res.data.bitsPerSample
}



