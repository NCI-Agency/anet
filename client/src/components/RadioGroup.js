import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'
import {ButtonGroup, Button, Radio} from 'react-bootstrap'

export default class RadioGroup extends Component {
	static contextTypes = {
		$bs_formGroup: PropTypes.object,
	}

	static propTypes = Object.assign({
		value: PropTypes.string,
		onChange: PropTypes.func,
	}, ButtonGroup.propTypes)

	constructor(props, context) {
		super(props, context)

		let formGroup = context.$bs_formGroup
		this.id = props.id || (formGroup && formGroup.controlId)
	}

	render() {
		let {children, ...props} = this.props

		return (
			<ButtonGroup data-toggle="buttons" {...props}>
				{React.Children.map(children, (child, index) => {
					if (!child) {
						return null
					}

					return (
						<Button key={child.props.value} active={this.props.value === child.props.value} onClick={this.onButtonClick}>
							<Radio
								id={this.id + '-' + child.props.value}
								name={this.id}
								{...child.props}
								onChange={this.onRadioChange}
								inline
								checked={this.props.value === child.props.value}
							/>
						</Button>
					)
				})}
			</ButtonGroup>
		)
	}

	@autobind
	onButtonClick(event) {
		let element = event.target
		if (element && element.nodeName.toUpperCase() !== 'BUTTON')
			return

		let radio = element.querySelector('[type=radio]')

		// since this isn't an actual form input changing, we need to manually
		// call our onChange event
		if (this.props.onChange)
			this.props.onChange(radio.value)
	}

	@autobind
	onRadioChange(event) {
		let checked = event.target
		this.props.onChange(checked.value)
	}
}
