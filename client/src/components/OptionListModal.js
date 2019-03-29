import autobind from "autobind-decorator"
import Messages from "components/Messages"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button, FormGroup, Grid, Modal } from "react-bootstrap"

export default class OptionListModal extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    showModal: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      error: null,
      value: ""
    }
  }

  @autobind
  handleChange(e) {
    this.setState({ value: e.target.value, error: null })
  }

  render() {
    return (
      <Modal show={this.props.showModal} onHide={this.close}>
        <Modal.Header closeButton>
          <Modal.Title>{this.props.title}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Grid fluid>
            <Messages error={this.state.error} />
            <FormGroup onChange={this.handleChange}>
              {this.props.children}
            </FormGroup>
          </Grid>
        </Modal.Body>

        <Modal.Footer>
          <Button className="pull-left" onClick={this.close}>
            Cancel
          </Button>
          <Button className="save-button" onClick={this.save} bsStyle="primary">
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }

  @autobind
  close() {
    this.props.onCancel()
  }

  @autobind
  save() {
    if (!this.state.value) {
      this.setState({
        error: { statusText: "Required", message: "please select an option" }
      })
      return
    }
    // allow caller to do something useful with this.state.value
    this.props.onSuccess(this.state.value)
  }
}
