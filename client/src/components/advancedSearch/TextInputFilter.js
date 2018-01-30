import React, {Component, PropTypes} from 'react'
import {FormControl} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import 'utils'


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
		this.updateFilter()
	}

	componentDidUpdate() {
		this.updateFilter()
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
