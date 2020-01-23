import PropTypes from "prop-types"
import React from "react"
import { Button } from "react-bootstrap"
import DOWNLOAD_ICON from "resources/download.png"

const SVGCanvas = ({
  width,
  height,
  exportTitle,
  zoomFn,
  svgRef,
  children
}) => {
  const exportSvg = () => {
    var svgBlob = new Blob(
      ['<?xml version="1.0" standalone="no"?>', svgRef.current.outerHTML],
      {
        type: "image/svg+xml;charset=utf-8"
      }
    )
    var svgUrl = URL.createObjectURL(svgBlob)
    var downloadLink = document.createElement("a")
    downloadLink.href = svgUrl
    downloadLink.download = exportTitle
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  return (
    <div>
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
          <Button onClick={() => zoomFn(1)}>+</Button>
          <Button onClick={() => zoomFn(-1)}>-</Button>
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
          <Button onClick={() => exportSvg()}>
            <img
              src={DOWNLOAD_ICON}
              height={16}
              alt={`Export ${exportTitle}`}
            />
          </Button>
        </div>
      )}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        ref={svgRef}
      >
        {children}
      </svg>
    </div>
  )
}

SVGCanvas.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  exportTitle: PropTypes.string,
  zoomFn: PropTypes.func,
  svgRef: PropTypes.object.isRequired,
  children: PropTypes.node
}

export default React.forwardRef((props, ref) => {
  return <SVGCanvas {...props} svgRef={ref} />
})
