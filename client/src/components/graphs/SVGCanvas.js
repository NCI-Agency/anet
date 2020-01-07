import PropTypes from "prop-types"
import React from "react"
import { Button } from "react-bootstrap"
import DOWNLOAD_ICON from "resources/download.png"

const SVGCanvas = props => {
  const exportSvg = () => {
    var svgBlob = new Blob(
      ['<?xml version="1.0" standalone="no"?>', props.svgRef.current.outerHTML],
      {
        type: "image/svg+xml;charset=utf-8"
      }
    )
    var svgUrl = URL.createObjectURL(svgBlob)
    var downloadLink = document.createElement("a")
    downloadLink.href = svgUrl
    downloadLink.download = props.exportTitle
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  return (
    <div>
      {props.zoomFn && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            top: "20px",
            left: "15px"
          }}
        >
          <Button onClick={() => props.zoomFn(1)}>+</Button>
          <Button onClick={() => props.zoomFn(-1)}>-</Button>
        </div>
      )}
      {props.exportTitle && (
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
              alt={`Export ${props.exportTitle}`}
            />
          </Button>
        </div>
      )}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={props.size.width}
        height={props.size.height}
        ref={props.svgRef}
      >
        {props.children}
      </svg>
    </div>
  )
}

SVGCanvas.propTypes = {
  size: PropTypes.object.isRequired,
  exportTitle: PropTypes.string,
  zoomFn: PropTypes.func,
  svgRef: PropTypes.object,
  children: PropTypes.node
}

export default React.forwardRef((props, ref) => {
  return <SVGCanvas {...props} svgRef={ref} />
})
