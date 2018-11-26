import React, {Component} from 'react'
import Form from 'components/Form'
import autobind from 'autobind-decorator'

import utils from 'utils'

import _some from 'lodash/some'
import _values from 'lodash/values'
import _get from 'lodash/get'
import _isEqual from 'lodash/isEqual'

export default class ValidatableFormWrapper extends Component {
	constructor() {
		super()
		this.state = {}
	}

	formHasUnsavedChanges(current, original) {
		return !_isEqual(current, original)
	}

	@autobind
	ValidatableForm(props) {
		const isSubmitDisabled = () => {
			const formErrors = _values(this.state.formErrors)
			// see notes below about three levels of error states. here we just check that
			// it's actually an error that we want to block.
			const disableSubmit = this.state.disableOnSubmit || props.submitDisabled
			return disableSubmit || (!props.canSubmitWithError && _some(formErrors, value => value >= 2))
		}

		const onSubmit = () => {
			this.setState({afterSubmit: true})
			props.onSubmit && props.onSubmit()
		}

		return <Form {...props} submitDisabled={isSubmitDisabled()} onSubmit={onSubmit} />
	}

	@autobind
	RequiredField(props) {
		const {canSubmitWithError} = props
		// individual form fields can be marked as submittable even with errors, so we have three levels of error state:
		// 0: no error, 1: warning, 2: error that should prevent submit
		const onError = () => this.setState({formErrors: {...this.state.formErrors, [props.uuid]: canSubmitWithError ? 1 : 2}})
		const onValid = () => this.setState({formErrors: {...this.state.formErrors, [props.uuid]: 0}})

		return <Form.Field {...Object.without(props, 'required', 'humanName', 'validateBeforeUserTouches')}
			validateBeforeUserTouches={this.state.afterSubmit || props.validateBeforeUserTouches}
			onError={onError}
			onValid={onValid}
			humanName={props.humanName || props.label || utils.sentenceCase(props.uuid)}
			required={_get(props, 'required', true)} />
	}
}
