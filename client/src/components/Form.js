import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Form as BSForm, Button} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import FormField from 'components/FormField'
import ConfirmDelete from 'components/ConfirmDelete'

import { withRouter } from 'react-router-dom'

class Form extends Component {
	static propTypes = Object.assign({}, BSForm.propTypes, {
		formFor: PropTypes.object,
		static: PropTypes.bool,
		submitText: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
		submitOnEnter: PropTypes.bool,
		submitDisabled: PropTypes.bool,
		onChange: PropTypes.func,
		onSubmit: PropTypes.func,
		onDelete: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
		bottomAccessory: PropTypes.node,
	})

	static defaultProps = {
		static: false,
		submitOnEnter: false,
		submitText: "Save",
	}

	static childContextTypes = {
		formFor: PropTypes.object,
		form: PropTypes.object,
	}

	getChildContext() {
		return {
			formFor: this.props.formFor,
			form: this,
		}
	}

	render() {
		let {children, submitText, submitOnEnter, submitDisabled, onDelete, bottomAccessory, ...bsProps} = this.props
		bsProps = Object.without(bsProps, 'formFor', 'static', 'staticContext')

		if (this.props.static) {
			bsProps.componentClass = 'div'
		}

		if (!submitOnEnter) {
			bsProps.onKeyDown = this.preventEnterKey
		}

		let showSubmit = bsProps.onSubmit && submitText !== false
		bsProps.onSubmit = this.onSubmit

		return (
			<BSForm {...bsProps} ref="container">
				{showSubmit && <div className="row">
					<div className="form-top-submit col-xs-12">
						<div className="pull-right">
							<Button bsStyle="primary"type="submit" disabled={submitDisabled}>
								{submitText}
							</Button>
						</div>
					</div>
				</div>}

				{children}

				{!this.props.static && (showSubmit || onDelete) &&
					<div className="submit-buttons">
						{showSubmit &&
							<div>
								<Button onClick={this.onCancel}>Cancel</Button>
							</div>
						}

						{bottomAccessory}

						{onDelete &&
							<div>
									<ConfirmDelete {...onDelete} />
							</div>
						}

						{showSubmit &&
							<div>
								<Button bsStyle="primary" type="submit" disabled={submitDisabled} id="formBottomSubmit">
									{submitText}
								</Button>
							</div>
						}
					</div>
				}
			</BSForm>
		)
	}

	preventEnterKey(event) {
		if (event.key === 'Enter' && event.target.nodeName !== 'TEXTAREA') {
			event.preventDefault()
			event.stopPropagation()
		}
	}

	@autobind
	onSubmit(event) {
		event.stopPropagation()
		event.preventDefault()

		this.props.onSubmit && this.props.onSubmit(event)
	}

	@autobind
	onCancel() {
		this.props.history.goBack()
	}
}

// just a little sugar to make importing and building forms easier
Form.Field = FormField

export default withRouter(Form)
