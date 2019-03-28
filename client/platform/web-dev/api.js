import BaseAPI from 'baseAPI'

const API = BaseAPI

function loadFileAjaxSync (filePath, mimeType) {	
    let xmlhttp=new XMLHttpRequest()	
    xmlhttp.open("GET",filePath,false)	
    const authHeader = API._getAuthHeader()	
    if (authHeader) {	
        xmlhttp.setRequestHeader(authHeader[0], authHeader[1])	
    }	
    if (mimeType != null) {	
        if (xmlhttp.overrideMimeType) {	
            xmlhttp.overrideMimeType(mimeType)	
        }	
    }	
    xmlhttp.send()	
    if (xmlhttp.status===200) {	
        return xmlhttp.responseText	
    }	
    else {	
        throw new Error("unable to load " + filePath)	
    }	
}

const Settings = JSON.parse(loadFileAjaxSync("/api/admin/dictionary", "application/json"))

export {Settings, API as default}
