import React, { Component } from "react"
import { Button, Modal } from "react-bootstrap"
import AvatarComponent from "components/AvatarComponent"

class AvatarEditModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showModal: false,
      currentPreview: null
    }

    this.avatarComponent = (
      <AvatarComponent
        src={props.src}
        onChangePreview={this.updateAvatarPreview}
      />
    )
  }

  close = () => {
    this.setState({ showModal: false })
  }

  save = () => {
    let updatedAvatar = this.state.currentPreview.substring(
      "data:image/jpeg;base64,".length - 1
    )
    this.props.onAvatarUpdate(updatedAvatar)
    this.close()
  }

  open = e => {
    e.preventDefault()
    this.setState({ showModal: true })
  }

  updateAvatarPreview = preview => {
    this.setState({ currentPreview: preview })
  }

  render() {
    return (
      <div>
        <button onClick={this.open}>{this.props.title}</button>

        <Modal
          bsSize={this.props.size}
          show={this.state.showModal}
          onHide={this.close}
        >
          <Modal.Header closeButton>
            <Modal.Title>{this.props.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{this.avatarComponent}</Modal.Body>
          <Modal.Footer>
            <Button onClick={this.save}>Save</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

export default AvatarEditModal
