import autobind from "autobind-decorator"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Alert } from "react-bootstrap"

export default class Messages extends Component {
  static propTypes = {
    error: PropTypes.object,
    success: PropTypes.string
  }

  @autobind
  render() {
    return (
      <div>
        {this.props.error && (
          <Alert bsStyle="danger">
            {this.props.error.statusText && `${this.props.error.statusText}: `}
            {this.props.error.message}
          </Alert>
        )}
        {this.props.success && (
          <Alert bsStyle="success">{this.props.success}</Alert>
        )}
      </div>
    )
  }
}
