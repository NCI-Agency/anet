import React, {Component} from 'react'

export default class GeneralBanner extends Component {
    render() {
        const bannerClassName = `general-banner alert ${this.props.banner.color}`

        return (
            <div className={bannerClassName}>
                <div className="messsage"><strong>{this.props.banner.title}:</strong> {this.props.banner.message}</div>
            </div>
        )
    }
}