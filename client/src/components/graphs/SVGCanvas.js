import React from "react"
import PropTypes from "prop-types"
import * as d3 from "d3"
import { Button } from "react-bootstrap"

export default class SVGCanvas extends React.Component {
  static propTypes = {
    size: PropTypes.object.isRequired
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
        <svg
          width={this.props.size.width}
          height={this.props.size.height}
          ref={element => (this.svg = d3.select(element))}
        />
      </div>
    )
  }
}
