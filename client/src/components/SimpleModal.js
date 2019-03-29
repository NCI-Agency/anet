import React, { Component } from "react"
import { Button, Modal } from "react-bootstrap"

class SimpleModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showModal: false
    }
    this.close = this.close.bind(this)
    this.open = this.open.bind(this)
  }

  close() {
    this.setState({ showModal: false })
  }

  open() {
    this.setState({ showModal: true })
    this.props.onClickModalOpen()
  }

  render() {
    return (
      <div>
        <span className="asLink" onClick={this.open}>
          {this.props.title}
        </span>

        <Modal
          bsSize={this.props.size}
          show={this.state.showModal}
          onHide={this.close}
        >
          <Modal.Header closeButton>
            <Modal.Title>{this.props.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{this.props.children}</Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

export default SimpleModal
