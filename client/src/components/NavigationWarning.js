import React, {Component} from 'react'
import autobind from 'autobind-decorator'
import {withRouter} from 'react-router'
import {Prompt} from 'react-router-dom'

const LEAVE_WARNING = 'Are you sure you wish to navigate away from the page? You will lose unsaved changes.'

class NavigationWarning extends Component {

	constructor(props, context) {
		super(props, context)

		this.state = {
			isBlocking: props.isBlocking,
		}
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.isBlocking !== nextProps.isBlocking) {
			this.setState({
				isBlocking: nextProps.isBlocking,
			})
		}
	}

	@autobind
	onBeforeUnloadListener(event) {
		if (this.state.isBlocking) {
			event.returnValue = LEAVE_WARNING
			event.preventDefault()
		}
	}

	componentWillMount() {
		window.addEventListener('beforeunload', this.onBeforeUnloadListener)
	}

	componentWillUnmount() {
		window.removeEventListener('beforeunload', this.onBeforeUnloadListener)
	}

	render() {
		return <Prompt
			when={this.state.isBlocking}
			message={LEAVE_WARNING}
		/>
	}

}

export default withRouter(NavigationWarning)
