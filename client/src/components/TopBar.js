import React, {Component} from 'react'

import NoPositionBanner from 'components/NoPositionBanner'
import GeneralBanner from 'components/GeneralBanner'
import SecurityBanner from 'components/SecurityBanner'
import Header from 'components/Header'

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

	render() {
        let currentUser = this.state.currentUser
		return (
			<div id="topbar" className="navbar navbar-fixed-top">
                {currentUser && currentUser.position && currentUser.position.id === 0 && !currentUser.isNewUser() && <NoPositionBanner />}
				<GeneralBanner banner={this.props.banner} />
                <SecurityBanner location={this.props.location} />
			    <Header minimalHeader={this.props.minimalHeader} />
            </div>
		)
	}
}