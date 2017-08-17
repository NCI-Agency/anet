import React from 'react'

function bannerClassName(level) {
    var output = 'general-banner alert'
    switch (level) {
        case 'notice':  return output += ' alert-info'
        case 'success': return output += ' alert-success'
        case 'error':   return output += ' alert-danger'
        case 'alert':   return output += ' alert-warning'
        default:        return output
    }
}

const GeneralBanner = (props) => {
    const banner = props.banner
    const showBanner = props.showBanner
    if (showBanner && banner.message){
        return (
            <div className={bannerClassName(banner.level)}>
                <div className="messsage"><strong>{banner.title}:</strong> {banner.message}</div>
            </div>
        )
    } else { return null }
}
export default GeneralBanner