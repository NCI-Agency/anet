import React, {Component} from 'react'

import NoPositionBanner from 'components/NoPositionBanner'
import GeneralBanner from 'components/GeneralBanner'
import SecurityBanner from 'components/SecurityBanner'
import Header from 'components/Header'

const GENERAL_BANNER_LEVEL = 'GENERAL_BANNER_LEVEL'
const GENERAL_BANNER_TEXT = 'GENERAL_BANNER_TEXT'
const GENERAL_BANNER_TITLE = 'Announcement'
const GENERAL_BANNER_VISIBILITY = 3
const visible = {
    USERS: 1,
    SUPER_USERS: 2,
    USERS_AND_SUPER_USERS: 3
}

export default class TopBar extends Component {
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

    showBanner(){
        if(GENERAL_BANNER_VISIBILITY === visible.USERS && this.props.currentUser && !this.props.currentUser.isSuperUser()){
            return true
        }
        if(GENERAL_BANNER_VISIBILITY === visible.SUPER_USERS && this.props.currentUser && this.props.currentUser.isSuperUser()){
            return true
        }
        if(GENERAL_BANNER_VISIBILITY === visible.USERS_AND_SUPER_USERS && (this.props.currentUser || this.props.currentUser.isSuperUser()) ){
            return true
        } else {
            return false
        }
    }

    bannerOptions(){
        return {
            level: this.props.settings[GENERAL_BANNER_LEVEL],
            message: this.props.settings[GENERAL_BANNER_TEXT],
            title: GENERAL_BANNER_TITLE,
            visibility: GENERAL_BANNER_VISIBILITY
        } || {}
    }

    render() {
        return (
            <div id="topbar" className="navbar navbar-fixed-top">
                {this.props.currentUser && this.props.position && this.props.position.id === 0 && !this.props.isNewUser() && <NoPositionBanner />}
                <GeneralBanner showBanner={this.showBanner()} banner={this.bannerOptions()} />
                <SecurityBanner location={this.props.location} />
                <Header minimalHeader={this.props.minimalHeader} />
            </div>
        )
    }
}
