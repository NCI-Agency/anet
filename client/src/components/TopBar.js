import React, {Component, PropTypes} from 'react'

import NoPositionBanner from 'components/NoPositionBanner'
import GeneralBanner from 'components/GeneralBanner'
import SecurityBanner from 'components/SecurityBanner'
import Header from 'components/Header'

// const GENERAL_BANNER_COLOR = 'alert-info'
const GENERAL_BANNER_TEXT = 'GENERAL_BANNER_TEXT'
// const GENERAL_BANNER_TITLE = 'Announcement'


export default class TopBar extends Component {
    static contextTypes = {
		app: PropTypes.object.isRequired,
    }

    constructor(props) {
        super(props)
        this.state = { 
            bodyPaddingTop: 0 
        }
        this.updateBodyPaddingTop = this.updateBodyPaddingTop.bind(this)
    }

    componentDidMount() {
        this.updateBodyPaddingTop()
        window.addEventListener("resize", this.updateBodyPaddingTop)
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateBodyPaddingTop)
    }

    componentDidUpdate() {
        this.updateBodyPaddingTop()
    }

    updateBodyPaddingTop() {
        let topbarPaddingHeight = document.getElementById('topbar').offsetHeight + 20
        if (this.state.bodyPaddingTop !== topbarPaddingHeight){
            document.body.style.paddingTop=`${topbarPaddingHeight}px` 
            this.setState({ bodyPaddingTop: topbarPaddingHeight })
        }
    }

	render() {
        let currentUser = this.state.currentUser
        let app = this.context.app
        let {settings} = app.state
        
        let banner = {
			message: settings[GENERAL_BANNER_TEXT],
			title: 'Announcement',
			color: 'alert-info'
		} || {}

		return (
			<div id="topbar" className="navbar navbar-fixed-top">
                {currentUser && currentUser.position && currentUser.position.id === 0 && !currentUser.isNewUser() && <NoPositionBanner />}
				{banner.message && <GeneralBanner banner={banner} />}
                <SecurityBanner location={this.props.location} />
			    <Header minimalHeader={this.props.minimalHeader} />
            </div>
		)
	}
}