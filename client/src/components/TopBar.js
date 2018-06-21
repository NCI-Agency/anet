import PropTypes from 'prop-types'
import React, {Component} from 'react'

import NoPositionBanner from 'components/NoPositionBanner'
import GeneralBanner from 'components/GeneralBanner'
import SecurityBanner from 'components/SecurityBanner'
import Header from 'components/Header'
import {Person} from 'models'
import AppContext from 'components/AppContext'

const GENERAL_BANNER_LEVEL = 'GENERAL_BANNER_LEVEL'
const GENERAL_BANNER_TEXT = 'GENERAL_BANNER_TEXT'
const GENERAL_BANNER_VISIBILITY = 'GENERAL_BANNER_VISIBILITY'
const GENERAL_BANNER_TITLE = 'Announcement'
const visible = {
    USERS: 1,
    SUPER_USERS: 2,
    USERS_AND_SUPER_USERS: 3
}

class BaseTopBar extends Component {
	static propTypes = {
		currentUser: PropTypes.instanceOf(Person),
		appSettings: PropTypes.object,
	}

    constructor(props) {
        super(props)
        this.state = { 
            bodyPaddingTop: 0,
            bannerVisibility: false
        }
        this.updateBodyPaddingTop = this.updateBodyPaddingTop.bind(this)
    }

    componentDidMount() {
        this.updateBodyPaddingTop()
        window.addEventListener("resize", this.updateBodyPaddingTop)
        this.updateBannerVisibility()
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateBodyPaddingTop)
    }

    componentDidUpdate() {
        this.updateBodyPaddingTop()
        this.updateBannerVisibility()
    }

    updateBodyPaddingTop() {
        let topbarPaddingHeight = document.getElementById('topbar').offsetHeight + 20
        if (this.state.bodyPaddingTop !== topbarPaddingHeight){
            document.body.style.paddingTop =`${topbarPaddingHeight}px` 
            this.props.updateTopbarOffset(topbarPaddingHeight)
            this.setState({ bodyPaddingTop: topbarPaddingHeight })
        }
    }

    updateBannerVisibility(){
        let visibilitySetting = parseInt(this.props.appSettings[GENERAL_BANNER_VISIBILITY], 10)
        let output = false
        const { currentUser } = this.props
        if (visibilitySetting === visible.USERS && currentUser && !currentUser.isSuperUser()) {
            output = true
        }
        if (visibilitySetting === visible.SUPER_USERS && currentUser && currentUser.isSuperUser()) {
            output = true
        }
        if (visibilitySetting === visible.USERS_AND_SUPER_USERS && (currentUser || currentUser.isSuperUser())) {
            output = true
        } 
        if (this.state.bannerVisibility !== output) {
            this.setState({ bannerVisibility: output})
        }
    }

    bannerOptions(){
        return {
            level: this.props.appSettings[GENERAL_BANNER_LEVEL],
            message: this.props.appSettings[GENERAL_BANNER_TEXT],
            title: GENERAL_BANNER_TITLE,
            visible: this.state.bannerVisibility
        } || {}
    }

    render() {
        return (
            <div id="topbar" className="navbar navbar-fixed-top">
                {this.props.currentUser && this.props.position && this.props.position.uuid === 0 && !this.props.isNewUser() && <NoPositionBanner />}
                <GeneralBanner options={this.bannerOptions()} />
                <SecurityBanner location={this.props.location} currentUser={this.props.currentUser} />
                <Header minimalHeader={this.props.minimalHeader} currentUser={this.props.currentUser} />
            </div>
        )
    }
}

const TopBar = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseTopBar appSettings={context.appSettings} currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default TopBar
