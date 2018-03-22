import {Component} from 'react'
import _isEqual from 'lodash/isEqual'
import _last from 'lodash/last'
import _get from 'lodash/get'
import autobind from 'autobind-decorator'
import {withRouter} from 'react-router'

class NavigationWarning extends Component {

// FIXME React16
// FIXME idea: https://reacttraining.com/react-router/web/example/preventing-transitions
//	formHasUnsavedChanges() {
//		return !_isEqual(this.props.current, this.props.original)
//	}
//
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
        return null
    }

}

export default withRouter(NavigationWarning)
