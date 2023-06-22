const params = new URLSearchParams(location.search)
var projectDir = params.get("projectPath")
var projectName = params.get("projectName").replace('#', '').replaceAll('%20', ' ')
var inputUpdateName = document.getElementById('update-project-name')
var displayProjectPath = document.getElementById('display-project-path')
const errorMessage = document.getElementById('error-projectSettings')

inputUpdateName.value = projectName
displayProjectPath.innerHTML = projectDir

function closeProjectSettings()
{
    window.api.req({reqType: 'closeProjectSettings', data: {projectName: projectName, projectDir: projectDir}})   
}

async function updateProjectName()
{
    if(inputUpdateName.value.trim() == '' || inputUpdateName.value == 'undefined')
    {
        return errorMessage.innerHTML = 'Project name cannot be empty.'
    }
    console.log('update project name')
    var newName = inputUpdateName.value
    var res = await window.api.req({reqType: 'updateProjectName', data: {projectName: projectName, newName: newName}})
    console.log(res)
    if(res.error != null)
    {
        return errorMessage.innerHTML = 'A project with that name already exists.'
    }
    projectName = newName
}

async function updateProjectPath()
{
    if(displayProjectPath.innerHTML.trim() == '' || displayProjectPath.innerHTML == 'undefined')
    {
        console.log('path cannot be empty')
        errorMessage.innerHTML = ' Project path cannot be empty.'
        return
    }
    var path = await window.api.req({reqType: 'chooseDirectory', data: {}})
    newPath = path
    displayProjectPath.innerHTML = newPath
    window.api.req({reqType: 'updateProjectPath', data: {projectName: projectName, newPath: newPath}})
}

function deleteProject()
{
    if (confirm("Are you sure?") == true) 
    {
        window.api.req({reqType: 'deleteProject', data: { projectName: projectName }})
    } 

    else 
    {
        
    }
}
