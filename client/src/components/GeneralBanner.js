import React, {Component} from 'react'

export default class GeneralBanner extends Component {

    bannerClassName(level){
        var output = 'general-banner alert'
        switch (level) {
            case 'notice':  return output += ' alert-info'
            case 'success': return output += ' alert-success'
            case 'error':   return output += ' alert-danger'
            case 'alert':   return output += ' alert-warning'
            default:        return output
        }
    }

    render() {
        return (
            <div className={this.bannerClassName(this.props.banner.level)}>
                <div className="messsage"><strong>{this.props.banner.title}:</strong> {this.props.banner.message}</div>
            </div>
        )
    }
}
