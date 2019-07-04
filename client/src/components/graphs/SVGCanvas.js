import React from "react"
import PropTypes from "prop-types"
import * as d3 from "d3"

export default class SVGCanvas extends React.Component {
  static propTypes = {
    size: PropTypes.object.isRequired
  }

  render() {
    return (
      <svg
        width={this.props.size.width}
        height={this.props.size.height}
        ref={element => (this.svg = d3.select(element))}
      />
    )
  }
}
