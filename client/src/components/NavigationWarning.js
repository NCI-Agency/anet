import React, {Component} from 'react'
import autobind from 'autobind-decorator'
import { Prompt, withRouter } from 'react-router-dom'

const LEAVE_WARNING = 'Are you sure you wish to navigate away from the page? You will lose unsaved changes.'

class NavigationWarning extends Component {

	@autobind
	onBeforeUnloadListener(event) {
		if (this.props.isBlocking) {
			event.returnValue = LEAVE_WARNING
			event.preventDefault()
		}
	}

	componentDidMount() {
		window.addEventListener('beforeunload', this.onBeforeUnloadListener)
	}

	componentWillUnmount() {
		window.removeEventListener('beforeunload', this.onBeforeUnloadListener)
	}

	render() {
		return <Prompt
			when={this.props.isBlocking}
			message={LEAVE_WARNING}
		/>
	}

}

export default withRouter(NavigationWarning)
