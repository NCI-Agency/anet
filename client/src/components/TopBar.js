import React, {Component} from 'react'

import NoPositionBanner from 'components/NoPositionBanner'
import GeneralBanner from 'components/GeneralBanner'
import SecurityBanner from 'components/SecurityBanner'
import Header from 'components/Header'

const GENERAL_BANNER_LEVEL = 'GENERAL_BANNER_LEVEL'
const GENERAL_BANNER_TEXT = 'GENERAL_BANNER_TEXT'
const GENERAL_BANNER_VISIBILITY = 'GENERAL_BANNER_VISIBILITY'
const GENERAL_BANNER_TITLE = 'Announcement'
const visible = {
    USERS: 1,
    SUPER_USERS: 2,
    USERS_AND_SUPER_USERS: 3
}

export default class TopBar extends Component {
    constructor(props) {
        super(props)
        this.state = { 
            bannerVisibility: false
        }
    }

    componentDidMount() {
        this.updateBannerVisibility()
    }

    componentDidUpdate() {
        this.updateBannerVisibility()
    }

    updateBannerVisibility(){
        let visibilitySetting = parseInt(this.props.settings[GENERAL_BANNER_VISIBILITY], 10)
        let output = false
        if(visibilitySetting === visible.USERS && this.props.currentUser && !this.props.currentUser.isSuperUser()){
            output = true
        }
        if(visibilitySetting === visible.SUPER_USERS && this.props.currentUser && this.props.currentUser.isSuperUser()){
            output = true
        }
        if(visibilitySetting === visible.USERS_AND_SUPER_USERS && (this.props.currentUser || this.props.currentUser.isSuperUser()) ){
            output = true
        } 
        if(this.state.bannerVisibility !== output){
            this.setState({ bannerVisibility: output})
        }
    }

    bannerOptions(){
        return {
            level: this.props.settings[GENERAL_BANNER_LEVEL],
            message: this.props.settings[GENERAL_BANNER_TEXT],
            title: GENERAL_BANNER_TITLE,
            visible: this.state.bannerVisibility
        } || {}
    }

    render() {
        return (
            <div>
                {this.props.currentUser && this.props.position && this.props.position.id === 0 && !this.props.isNewUser() && <NoPositionBanner />}
                <GeneralBanner options={this.bannerOptions()} />
                <SecurityBanner location={this.props.location} />
                <Header minimalHeader={this.props.minimalHeader} toggleMenuAction={this.props.toggleMenuAction}/>
            </div>
        )
    }
}
