export function loadFileAjaxSync(filePath, mimeType, body, authorization) {
  const xmlhttp = new XMLHttpRequest()
  if (body) {
    xmlhttp.open("POST", filePath, false)
    xmlhttp.setRequestHeader("Content-Type", mimeType)
    if (authorization) {
      xmlhttp.setRequestHeader("Credentials", "same-origin")
      xmlhttp.setRequestHeader("Authorization", `Bearer ${authorization}`)
    }
    xmlhttp.send(body)
  } else {
    xmlhttp.open("GET", filePath, false)
    if (mimeType !== null) {
      if (xmlhttp.overrideMimeType) {
        xmlhttp.overrideMimeType(mimeType)
      }
    }
    xmlhttp.send()
  }
  if (xmlhttp.status === 200) {
    return xmlhttp.responseText
  } else {
    throw new Error("unable to load " + filePath)
  }
}
