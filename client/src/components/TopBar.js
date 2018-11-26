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
        topbarHeight: PropTypes.func.isRequired,
	}

    constructor(props) {
        super(props)
        this.state = {
            bannerVisibility: false,
            height: 0,
        }
        this.topbarDiv = React.createRef()
    }

    componentDidMount() {
        this.handleTopbarHeight()
        this.updateBannerVisibility()
        window.addEventListener("resize", this.handleTopbarHeight)
    }

    componentDidUpdate() {
        this.handleTopbarHeight()
        this.updateBannerVisibility()
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.handleTopbarHeight)
    }

    handleTopbarHeight = () => {
        const height = this.topbarDiv.current.clientHeight
        if(height !== undefined && height !== this.state.height) {
            this.setState({ height }, () => this.props.topbarHeight(this.state.height))
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
        const { currentUser } = this.props
        return (
            <div
                style={{ flex:'0 0 auto', zIndex: 100}}
                ref={this.topbarDiv}
            >
                <div>
                    <GeneralBanner options={this.bannerOptions()} />
                    <SecurityBanner location={this.props.location} />
                    {/* Todo remove check for currentUser.id below once initial state is handled better */}
                    {currentUser && currentUser.id && !currentUser.hasActivePosition() && !currentUser.isNewUser() && <NoPositionBanner />}
                    <Header minimalHeader={this.props.minimalHeader} toggleMenuAction={this.props.toggleMenuAction}/>
                </div>
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
