import React, { Component } from "react"
import PropTypes from "prop-types"

import "draft-js/dist/Draft.css"

/**
 * Editor block to preview and edit images.
 */
class ImageBlock extends Component {
  constructor(props) {
    super(props)

    this.state = {
      dataURL: "",
      alt: ""
    }
  }

  componentDidMount() {
    const { blockProps } = this.props
    const { entity } = blockProps
    const { src, alt } = entity.getData()
    this.toDataURL(src, dataURL => {
      this.setState({
        dataURL: dataURL,
        alt: alt
      })
    })
  }

  toDataURL(src, callback, outputFormat) {
    var img = new Image()
    img.crossOrigin = "Anonymous"
    img.onload = function() {
      var canvas = document.createElement("CANVAS")
      var ctx = canvas.getContext("2d")
      var dataURL
      canvas.height = this.naturalHeight
      canvas.width = this.naturalWidth
      ctx.drawImage(this, 0, 0)
      dataURL = canvas.toDataURL(outputFormat)
      callback(dataURL)
    }
    img.src = src
    if (img.complete || img.complete === undefined) {
      img.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
      img.src = src
    }
  }

  render() {
    const { dataURL, alt } = this.state
    return <img className="ImageBlock" src={dataURL} alt={alt} width="256" />
  }
}

ImageBlock.propTypes = {
  blockProps: PropTypes.object.isRequired
}

export default ImageBlock
