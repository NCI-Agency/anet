import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {FormControl} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import _isEqualWith from 'lodash/isEqualWith'
import utils from 'utils'

export default class TextInputFilter extends Component {
	static propTypes = {
		queryKey: PropTypes.string.isRequired,
		//Passed by the SearchFilter row
		//value
		//onChange
	}

	constructor(props) {
		super(props)
		this.state = {
			value: props.value || {value: ""}
		}
	}

	componentDidMount() {
		this.updateFilter()
	}

	componentDidUpdate(prevProps, prevState) {
		if (!_isEqualWith(prevProps.value, this.props.value, utils.treatFunctionsAsEqual)) {
			this.setState({value: this.props.value}, this.updateFilter)
		}
	}

	render() {
		return <FormControl
			value={this.state.value.value}
			onChange={this.onChange}
		/>
	}

	@autobind
	onChange(event) {
		let {value} = this.state
		value.value = event.target.value
		this.setState({value}, this.updateFilter)
	}

	@autobind
	toQuery() {
		return {[this.props.queryKey]: this.state.value.value}
	}

	@autobind
	updateFilter() {
		let {value} = this.state
		value.toQuery = this.toQuery
		this.props.onChange(value)
	}

}
