var projects
const tableProjectsBody = document.getElementById('table-body-projects')
const errorMessage = document.getElementById('error-projects')
const displayProjectName = document.getElementById('input-project-name')
const displayProjectPath = document.getElementById('input-project-path')
const selectDelimiter = document.getElementById('select-delimiter')
var selectedDelimiter = "_"
const displayUserData = document.getElementById('format-userData')
var userData
var currentUserData = []

var newProjectPath

getProjects()
async function getProjects()
{
    var res = await window.api.req({reqType: 'getProjects', data: {}})
    if(res.error != null)
    {
        //display error message in error display
    }
    projects = res.data.projects
    var output = ''
    projects.forEach((project, index, array) => {
        output += /* html */
        `
            <tr>
                <td class="display-project-name" onclick="selectProject(event)">${project.name}</i></td>
            </tr>
        `
    })
    tableProjectsBody.innerHTML = output
}

async function selectProject(ev)
{
    var res = await window.api.req({reqType: 'selectProject', data: {projectName: ev.currentTarget.innerHTML}})
    if(res.error != null)
    {
        //display error message
    }
    var project = res.data.project
}

async function chooseDirectory()
{
    var path = await window.api.req({reqType: 'chooseDirectory', data: {}})
    newProjectPath = path
    displayProjectPath.innerHTML = newProjectPath
}

function changeDelimiter(e)
{
    selectedDelimiter = e.currentTarget.value
    const delimiterDisplays = document.querySelectorAll('.display-delimiter')
    delimiterDisplays.forEach((item, index, arr) => {
        item.innerHTML = selectedDelimiter
    })
}



function addUserField()
{
    output = /*html*/
    `
        <p class="display-delimiter">${selectedDelimiter}</p>
        <input class="input-userData" type="text" onkeyup="updateUserData()">
    `
    displayUserData.innerHTML += output

    document.querySelectorAll('.input-userData').forEach((item, index, arr) => {
        if(currentUserData[index] != null)
        {
            item.value = currentUserData[index]
        }
    })
}

function removeUserField()
{
    const userDataInputs = document.querySelectorAll('.input-userData')
    const delimiterDisplays = document.querySelectorAll('.display-delimiter')
    userDataInputs[userDataInputs.length-1].remove()
    delimiterDisplays[delimiterDisplays.length-1].remove()
    currentUserData.pop()
}

function updateUserData()
{
    console.log('update user data')
    currentUserData = []
    document.querySelectorAll('.input-userData').forEach((item, index, arr) => {
        currentUserData.push(item.value)
    })
    console.log(currentUserData)
}

async function createProject()
{
    if(displayProjectName.value.trim() == '' || displayProjectName.value == 'undefined')
    {
        errorMessage.innerHTML = 'Project name cannot be empty.'
        return
    }

    if(displayProjectPath.innerHTML.trim() == '' || displayProjectPath.innerHTML == 'undefined')
    {
        errorMessage.innerHTML = ' Project path cannot be empty.'
        return
    }
    var res = await window.api.req({reqType: 'createProject', 
    data: 
    {
        projectName: displayProjectName.value.trim(), 
        projectPath: displayProjectPath.innerHTML.trim(),
        projectDelimiter: '_',
        projectUserData: getUserData()
    }})
    if(res.error != null)
    {
        return errorMessage.innerHTML = res.error
    }
    window.location.reload()
}

function getUserData()
{
    var output = []
    const userDataInputs = document.querySelectorAll('.input-userData')
    userDataInputs.forEach((item, index, arr) => {
        output.push(item.value)
    })
    return output
}



