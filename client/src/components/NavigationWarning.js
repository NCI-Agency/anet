import React, {Component} from 'react'
//import _last from 'lodash/last'
//import _get from 'lodash/get'
//import autobind from 'autobind-decorator'
import {withRouter} from 'react-router'
import {Prompt} from 'react-router-dom'

class NavigationWarning extends Component {

	constructor(props, context) {
		super(props, context)

		this.state = {
			isBlocking: props.isBlocking,
		}
	}

	componentWillReceiveProps(nextProps) {
		if (this.state.isBlocking !== nextProps.isBlocking) {
			this.setState({
				isBlocking: nextProps.isBlocking,
			})
		}
	}

//	@autobind
//	onBeforeUnloadListener(event) {
//		if (this.formHasUnsavedChanges()) {
//			event.returnValue = 'Are you sure you wish to navigate away from the page? You will lose unsaved changes.'
//			event.preventDefault()
//		}
//	}
//
//	@autobind
//	routeLeaveHook(nextRoute) {
//        const skipPageLeaveWarning = _get(nextRoute, ['state', 'skipPageLeaveWarning'])
//		if (this.formHasUnsavedChanges() && !skipPageLeaveWarning) {
//			return 'Are you sure you wish to navigate away from the page? You will lose unsaved changes.'
//		}
//        if (skipPageLeaveWarning) {
//            nextRoute.state.skipPageLeaveWarning = false
//        }
//	}
//
//	componentWillMount() {
//		this.unsetRouteLeaveHook =
//			this.props.router.setRouteLeaveHook(_last(this.props.routes), this.routeLeaveHook)
//		window.addEventListener('beforeunload', this.onBeforeUnloadListener)
//	}
//
//	componentWillUnmount() {
//		this.unsetRouteLeaveHook()
//		window.removeEventListener('beforeunload', this.onBeforeUnloadListener)
//	}

	render() {
		return <Prompt
			when={this.state.isBlocking}
			message="Are you sure you wish to navigate away from the page? You will lose unsaved changes."
		/>
	}

}

export default withRouter(NavigationWarning)
