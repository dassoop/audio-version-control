const {dialog, BrowserWindow, app, shell} = require('electron')
const path = require('path')
const fs = require('fs')
const JSZip = require('jszip')
const zip = new JSZip();
const { json } = require('stream/consumers')
const mm = require('music-metadata');
const util = require('util');

var dir = __dirname
var fileList
var pathList = {}
var permittedExtensions
var format
var regexPattern
var delimiter
var fileList
var settingsDir

module.exports = 
{
    req: async(req, res) => {
        switch(req.reqType) 
        {
            case 'traverseDir':
                return traverseDir(req, res)
            case 'getProjects':
                return getProjects(req, res)
            case 'selectProject':
                var project = await getProject(req, res)
                return mainWindow.loadFile(path.join(__dirname, './view/html/index.html'), 
                {
                    query: 
                    { 
                        project: JSON.stringify(project)
                    }
                })
            case 'openProjectSettings':
                var project = await getProject(req)
                return mainWindow.loadFile(path.join(__dirname, './view/html/projectSettings.html'), 
                {
                    query: 
                    { 
                        projectName: req.data.projectName,
                        projectPath: project.dir
                    }
                })
            case 'closeProjectSettings':
                var project = await getProject(req)
                return mainWindow.loadFile(path.join(__dirname, './view/html/index.html'), 
                {
                    query: 
                    { 
                        project: JSON.stringify(project)
                    }
                })
            case 'viewProjects':
                return mainWindow.loadFile(path.join(__dirname, './view/html/projects.html'))
            case 'chooseDirectory':
                return chooseDir()
            case 'createProject':
                return createProject(req, res)
            case 'updateProjectName':
                return updateProjectName(req, res)
            case 'updateProjectPath':
                return updateProjectPath(req, res)
            case 'deleteProject': 
                deleteProject(req.data.projectName)
                return mainWindow.loadFile(path.join(__dirname, './view/html/projects.html'))
            case 'addNote':
                return addNote(req, res)
            case 'updateNote':
                return updateNote(req, res)
            case 'getFile':
                return getFile(req, res)
            case 'starFile':
                return starFile(req, res)
            case 'openDirInExplorer': 
                return openDirInExplorer(req, res)
            case 'openFileInExplorer': 
                return openFileInExplorer(req, res)
            case 'exportFiles':
                return exportFiles(req, res)
            case 'getFileMetaData': 
                return getFileMetaData(req, res)
            default:     
        }
    }
}

initProgramSettings()

async function initProgramSettings()
{
    settingsDir = app.getPath('home') + '/AVC'
    if (!fs.existsSync(settingsDir))
    {
        fs.mkdirSync(settingsDir);
        var data =
        {
            projects: 
            [
    
            ]
        }
        fs.writeFile(`${settingsDir}/settings-program.json`, JSON.stringify(data, null, 2), function(err) {
            if (err) 
            {
                console.log('error')
            }
        });
    }
    else
    {
        var programSettings = await JSON.parse(fs.readFileSync(`${settingsDir}/settings-program.json`, `utf8`))
    }
}

async function init(dir)
{
    console.log('starting init')
    if(fs.existsSync(dir))
    {
        var rootDir = fs.readdirSync(dir).sort()
        fileList = traverseDirectory(rootDir, dir)
        var data = formatData(fileList, format)
        var db = await createDb(data)
        var settings = await initializeData(db, dir)
        console.log('finish init')
        return settings
    }  
}

function getFormat(userFormat, delim)
{
    permittedExtensions = ['wav', 'mp3', 'ogg', 'mp4', 'mov', 'mid']
    delimiter = delim 
    var userPattern = ''
    userFormat.forEach((item, index, array) => {
        userPattern += delimiter + '(.*)'
    })
    regexPattern = `^(.*)${userPattern}[.]{1}(.*)`;
    format = 
    [
        ['filename', String]
        ,['name', String]
    ];
    userFormat.forEach((item, index, array) => {
        format.push(item)
    })
    format.push(['fileType', String])
}

async function initializeData(db, projectDir)
{
    var settings
    if(!fs.existsSync(`${projectDir}/settings-project.json`))
    {
        try
        {
            await fs.promises.writeFile(`${projectDir}/settings-project.json`, JSON.stringify(db, null, 2))
            settings = await JSON.parse(fs.readFileSync(`${projectDir}/settings-project.json`, 'utf8'));
            return settings
        }
        catch
        {
            console.log('failed')
        }
    }
    else
    {
        settings = await JSON.parse(fs.readFileSync(`${projectDir}/settings-project.json`, 'utf8'));

        db.forEach(async (dbItem, index, arr) =>{ 
            var inSettings = false
            settings.forEach((settingsItem, index, arr) => {
                if(settingsItem.filename == dbItem.filename)
                {
                    inSettings = true
                    settingsItem.path = dbItem.path
                }
            })

            if(inSettings == false)
            {
                settings.push(dbItem)
            }
        })

        settings = await sortByName(settings)

        await fs.promises.writeFile(`${projectDir}/settings-project.json`, JSON.stringify(settings, null, 2), function(err) {
            if (err) 
            {

            }
        });

        settings.forEach((settingsItem, index, arr) => {
            if(!fileList.includes(settingsItem.filename))
            {
                settingsItem.missing = true
            }
            else
            {
                settingsItem.missing = false
            }
        })

        return settings.sort()
    }
}

async function sortByName(settings)
{
    settings.sort((a, b) => {
        if (a.filename < b.filename) 
        {
          return -1;
        }
      });
    return settings
}

async function createDb(data)
{
    var db = []
    data.forEach(function(item, index, array)
    {
        var userData = []
        Object.keys(item).forEach((key, index, arr) => {
            
            if(key != 'path' && key != 'filename' && key != 'name' && key != 'fileType')
            {
                userData.push(item[key])
            }
            
        })
        obj = 
        {
            path: pathList[item['filename']],
            filename: item['filename'],
            name: item['name'],
            fileType: item['fileType'],
            userData: userData,
            missing: false,
            hidden: false,
            starred: false,
            notes: []
        }
        db.push(obj)
    });
    return db 
}

function traverseDirectory(dir, projectPath)
{
    fileList = []
    traverseDirectoryHelper(dir, projectPath)
    return fileList.sort()
}

function traverseDirectoryHelper(dir, projectPath)
{
    for(var i = 0; i < dir.length; i++)
    {
        let fileName = dir[i]
        projectPath += '/' + fileName

        if(fs.lstatSync(projectPath).isDirectory())
        {
            let childDir = fs.readdirSync(projectPath);
            traverseDirectoryHelper(childDir, projectPath)
        }
        else
        {
            var extSplit = fileName.split('.')
            if(permittedExtensions.includes(extSplit[1]))
            {
                fileList.push(fileName)
                pathList[fileName] = projectPath
            }
        }
        projectPath = projectPath.replace('/' + fileName, '')
    }
}

function formatData(data, format)
{
	var output = []
	data.forEach(function(item, index, array)
	{
		var regex = new RegExp(regexPattern);
		var parsed = item.match(regex);
		var obj = {};
		if(parsed != null)
        {
            format.forEach(function(item, index, array)
            {          
                if(item[0] != null)
                {
                    obj[item[0]] = item[1](parsed[index]);
                }
            });
            output.push(obj)
        }
	});
	return output
}

chooseDir = async () => {
    const { canceled, filePaths } = 
    await dialog.showOpenDialog(
    {
        properties: ['openDirectory']
    });

    if (canceled) 
    {

    } 
    else 
    {
        projectPath = filePaths[0]
        return projectPath
    }
},

exportFiles = async (req, res) => {
    var userChosenPath = await dialog.showSaveDialog(
    { 
        defaultPath: 'export.zip',  
        properties: [{title: 'export'}]
    });

    if(userChosenPath.canceled == true) return;

    var projectSettings = await JSON.parse(fs.readFileSync(req.body.projectPath + '/settings-project.json', 'utf8'))     

    try 
    {
        await projectSettings.forEach(function(file) 
        {
            if(file.starred)
            {
                fileData = fs.readFileSync(file.path);
                zip.file(file.filename, fileData);
            }
        })

        zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
            .pipe(fs.createWriteStream(userChosenPath.filePath))
            .on('finish', function () 
            {
                console.log("sample.zip written.");
            });

    } 
    catch (err) 
    {
        console.error(err)
    }
},

traverseDir = async (req, res) => {
    var projectDir = req.data.projectDir
    var delimiter = req.data.delimiter
    var userData = req.data.userData
    var userDataFormatted = []
    if(userData != undefined)
    {
        userData.forEach((item, index, arr) => {
            var field = [item, String]
            userDataFormatted.push(field)
        })
    }

    getFormat(userDataFormatted, delimiter)
    data = 
    {
        path: projectDir, 
        db: await init(projectDir),
        delimiter: delimiter
    }
    return data
},

getProjects = async (req, res) => {
    
    if (fs.existsSync(`${settingsDir}/settings-program.json`, `utf8`)) 
    {
        var programSettings = JSON.parse(fs.readFileSync(`${settingsDir}/settings-program.json`, `utf8`))
        res.data.projects = programSettings.projects
    }
    else
    {
        res.error = []
        res.error.push('Project data not found.')
    }
    return res
},

getProject = async (req, res) => {
    var projectName = req.data.projectName
    var programSettings = await JSON.parse(fs.readFileSync(`${settingsDir}/settings-program.json`, `utf8`))
    var output
    await programSettings["projects"].forEach((project) => {
        if(projectName == project.name)
        {
            output = project 
        }
    })
    return output
},

createProject = async (req, res) => {
    var projectName = req.data.projectName
    var projectPath = req.data.projectPath
    var projectDelimiter = req.data.projectDelimiter
    var projectUserData = req.data.projectUserData

    var programSettings = await JSON.parse(fs.readFileSync(`${settingsDir}/settings-program.json`, `utf8`))
    var nameTaken = false 

    programSettings.projects.forEach((item, index, array) => {
        if(item.name == projectName) 
        {
            nameTaken = true
        }
    })
    
    if(nameTaken == true)
    {
        res.error = []
        res.error.push('A project with that name already exists.')
    }
    else
    {
        programSettings.projects.push(
            {
                name: projectName, 
                dir: projectPath, 
                delimiter: projectDelimiter,
                userData: projectUserData
            })

        res.data.programSettings = programSettings

        fs.writeFile(`${settingsDir}/settings-program.json`, JSON.stringify(programSettings, null, 2), function(err) {
            if (err) 
            {
                res.error = []
                res.error.push('Cannot find projects data.')
            }
        });
    }
    return res
},

updateProjectName = async (req, res) => {
    var projectName = req.data.projectName
    var newName = req.data.newName
    var programSettings = await JSON.parse(fs.readFileSync(`${settingsDir}/settings-program.json`, `utf8`))
    var nameTaken = false 

    programSettings.projects.forEach((item, index, array) => {
        if(item.name == newName) 
        {
            nameTaken = true
        }
    })
    
    if(nameTaken == true)
    {
        res.error = []
        res.error.push('A project with that name already exists.')
    }
    else
    {
        programSettings.projects.forEach((item, index, array) => {
            if(item.name == projectName) 
            {
                item.name = newName
            }
        })

        fs.writeFile(`${settingsDir}/settings-program.json`, JSON.stringify(programSettings, null, 2), function(err) {
            if (err) 
            {
                console.log('error')
            }
        });
    }
    return res
}, 

updateProjectPath = async (req, res) => {
    var projectName = req.data.projectName 
    var newPath = req.data.newPath
    var programSettings = await JSON.parse(fs.readFileSync(`${settingsDir}/settings-program.json`, `utf8`))
    programSettings.projects.forEach((item, index, array) => {
        if(item.name == projectName) 
        {
            item.dir = newPath
            
        }
    })
    fs.writeFile(`${settingsDir}/settings-program.json`, JSON.stringify(programSettings, null, 2), function(err) {
        if (err) 
        {
            console.log('error')
        }
    });
    
    res = {
        msg: 200, 
        error: null
    }
    return res
},

deleteProject = async (projectName) => {
    var programSettings = await JSON.parse(fs.readFileSync(`${settingsDir}/settings-program.json`, `utf8`))
    programSettings.projects.forEach((item, index, array) => {
        if(item.name == projectName) 
        {
            programSettings.projects.splice(index, 1);
            fs.writeFile(`${settingsDir}/settings-program.json`, JSON.stringify(programSettings, null, 2), function(err) {
                if (err) 
                {
                    console.log('error')
                }
            });
        }
    })
    res = {
        msg: 200, 
        error: null
    }
    return res
},

addNote = async (req, res) => {
    var projectSettings = await JSON.parse(fs.readFileSync(req.data.projectPath + '/settings-project.json', 'utf8'))
    var output
    await projectSettings.forEach((file) => {
        if(file.filename == req.data.fileName)
        {
            file.notes.push({
                complete: false, 
                text: req.data.noteText
            })
            res.data.file = file
        }
    })

    fs.writeFile(req.data.projectPath + '/settings-project.json', JSON.stringify(projectSettings, null, 2), function(err) {
        if (err) 
        {
            res.error = [
                'error saving to project settings'
            ]
            return res
        }
    });
    return res
},

updateNote = async (req, res) => {

    var projectSettings = await JSON.parse(fs.readFileSync(req.data.projectPath + '/settings-project.json', 'utf8'))
    
    await projectSettings.forEach((file) => {
        
        if(file.filename == req.data.fileName)
        {
            // console.log(req.data.selectedFile)
            file.notes = req.data.selectedFile.notes
            res.data.file = file
        }
    })

    await fs.promises.writeFile(req.data.projectPath + '/settings-project.json', JSON.stringify(projectSettings, null, 2), function(err) {
        if (err) 
        {
            res.error = [
                'error saving to project settings'
            ]
            return res
        }
    });

    res.data.db = projectSettings
    return res
},

getFile = async (req, res) => {
    var fileName = req.data.fileName
    var projectPath = req.data.projectPath
    var projectSettings = await JSON.parse(fs.readFileSync(projectPath + '/settings-project.json', 'utf8'))

    projectSettings.forEach((item, index, arr) => {
        var split = item.filename.split('.')
        if(split[0] == fileName)
        {
            res.data.file = item
        }
    })
    if(res.data.file == null)
    {
        res.error = [].push('File not found.')
    }
    return res
},

starFile = async (req, res) => {
    var projectSettings = await JSON.parse(fs.readFileSync(req.data.projectPath + '/settings-project.json', 'utf8'))
    await projectSettings.forEach((file) => {
        if(file.filename == req.data.fileName)
        {
            if(file.starred == true) file.starred = false
            else file.starred = true
            res.data.starred = file.starred
        }
    })
    fs.writeFile(req.data.projectPath + '/settings-project.json', JSON.stringify(projectSettings, null, 2), function(err) {
        if (err) 
        {
            res.error = [
                'error saving to project settings'
            ]
            return res
        }
    });
    if(res.data.starred == null)
    {
        res.data.error = [].push('File not found')
    }
    return res
},

openDirInExplorer = async (req, res) => {
    shell.showItemInFolder(req.data.path)
    return res
},

openFileInExplorer = async (req, res) => {
    shell.showItemInFolder(req.data.path)
    return res
},

getFileMetaData = async (req, res) => {
    try 
    {
        const metadata = await mm.parseFile(req.body.filePath);
        console.log(util.inspect(metadata.format, { showHidden: false, depth: null }));
        console.log(metadata.format)
        res.data.metadata = metadata.format 
        res.data.sampleRate = metadata.format.sampleRate
        res.data.numberOfChannels = metadata.format.numberOfChannels    
        if(metadata.format.bitsPerSample != null) res.data.bitsPerSample = metadata.format.bitsPerSample
        else res.data.bitsPerSample = 'N/A'
        // res.body["data"] = util.inspect(metadata.format, { showHidden: false, depth: null })
    } 
    catch (error) 
    {
        console.error(error.message);
        res.error = [].push(error.message)
    }
    return res
}
