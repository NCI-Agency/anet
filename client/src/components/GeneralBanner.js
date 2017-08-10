import React, {Component} from 'react'

export default class GeneralBanner extends Component {
    render() {
        const bannerClassName = `general-banner alert ${this.props.banner.statusColor}`
        return (
            <div className={bannerClassName}>
                <div className="messsage"><strong>Announcement:</strong> {this.props.banner.message}</div>
            </div>
        )
    }
}