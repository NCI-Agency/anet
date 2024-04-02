import PropTypes from "prop-types"
import React, { useRef } from "react"
import { Button } from "react-bootstrap"
import DEFAULT_AVATAR from "resources/default_avatar.svg?inline"
import DOWNLOAD_ICON from "resources/download.png"

const SVGCanvas = ({
  width,
  height,
  style: initialStyle,
  exportTitle,
  zoomFn,
  children
}) => {
  const svgRef = useRef(null)
  const style =
    zoomFn || exportTitle
      ? { position: "relative", ...initialStyle }
      : initialStyle

  return (
    <div style={style}>
      {zoomFn && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            top: "20px",
            left: "15px"
          }}
        >
          <Button onClick={() => zoomFn(1)} variant="outline-secondary">
            +
          </Button>
          <Button onClick={() => zoomFn(-1)} variant="outline-secondary">
            -
          </Button>
        </div>
      )}
      {exportTitle && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            top: "20px",
            right: "15px"
          }}
        >
          <Button onClick={() => exportSvg()} variant="outline-secondary">
            <img
              src={DOWNLOAD_ICON}
              height={16}
              alt={`Export ${exportTitle}`}
            />
          </Button>
        </div>
      )}
      <svg
        width={width}
        height={height}
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
      >
        {children}
      </svg>
    </div>
  )

  async function exportSvg() {
    const svgClone = svgRef.current.cloneNode(true)
    const images = svgClone.getElementsByTagName("image")
    const allPromises = []
    for (const image of images) {
      if (!image.getAttribute("href").startsWith("data:")) {
        // Replace image with its Base64-encoded data
        const promise = toDataUrl(image.getAttribute("href"))
          .then(dataUrl => image.setAttribute("href", dataUrl))
          .catch(() => image.setAttribute("href", DEFAULT_AVATAR))
        allPromises.push(promise)
      }
    }
    await Promise.all(allPromises)
    const svgBlob = new Blob(
      ['<?xml version="1.0" standalone="no"?>', svgClone.outerHTML],
      {
        type: "image/svg+xml;charset=utf-8"
      }
    )
    const svgUrl = URL.createObjectURL(svgBlob)
    const downloadLink = document.createElement("a")
    downloadLink.href = svgUrl
    downloadLink.download = exportTitle
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  async function toDataUrl(imageUrl) {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src = imageUrl
    await image.decode()
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    canvas.height = image.naturalHeight
    canvas.width = image.naturalWidth
    context.drawImage(image, 0, 0)
    return canvas.toDataURL()
  }
}

SVGCanvas.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  style: PropTypes.object,
  exportTitle: PropTypes.string,
  zoomFn: PropTypes.func,
  children: PropTypes.node
}

export default React.forwardRef((props, ref) => {
  return <SVGCanvas {...props} svgRef={ref} />
})
