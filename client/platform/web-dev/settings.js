function loadFileAjaxSync(filePath, mimeType) {
  const xmlhttp = new XMLHttpRequest()
  xmlhttp.open("GET", filePath, false)
  if (mimeType !== null) {
    if (xmlhttp.overrideMimeType) {
      xmlhttp.overrideMimeType(mimeType)
    }
  }
  xmlhttp.send()
  if (xmlhttp.status === 200) {
    return xmlhttp.responseText
  } else {
    throw new Error("unable to load " + filePath)
  }
}

const Settings = JSON.parse(
  loadFileAjaxSync("/api/admin/dictionary", "application/json")
)

export default Settings
