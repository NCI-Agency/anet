import React from "react"
import PropTypes from "prop-types"
import * as d3 from "d3"
import { Button } from "react-bootstrap"
import DOWNLOAD_ICON from "resources/download.png"

export default class SVGCanvas extends React.Component {
  static propTypes = {
    size: PropTypes.object.isRequired,
    exportTitle: PropTypes.string
  }

  render() {
    return (
      <div>
        {this.zoomFn && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              top: "20px",
              left: "15px"
            }}
          >
            <Button onClick={() => this.zoomFn(1)}>+</Button>
            <Button onClick={() => this.zoomFn(-1)}>-</Button>
          </div>
        )}
        {this.props.exportTitle && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              top: "20px",
              right: "15px"
            }}
          >
            <Button onClick={() => this.exportSvg()}>
              <img
                src={DOWNLOAD_ICON}
                height={16}
                alt={`Export ${this.props.exportTitle}`}
              />
            </Button>
          </div>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={this.props.size.width}
          height={this.props.size.height}
          ref={element => (this.svg = d3.select(element))}
        />
      </div>
    )
  }

  exportSvg() {
    var svgBlob = new Blob(['<?xml version="1.0" standalone="no"?>', this.svg.node().outerHTML], {
      type: "image/svg+xml;charset=utf-8"
    })
    var svgUrl = URL.createObjectURL(svgBlob)
    var downloadLink = document.createElement("a")
    downloadLink.href = svgUrl
    downloadLink.download = this.props.exportTitle
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }
}
