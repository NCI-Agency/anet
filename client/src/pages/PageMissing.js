import React from 'react'
import Page from 'components/Page'
import NotFound from 'components/NotFound'

export default class PageMissing extends Page {
    static pageProps = {
        fluidContainer: true,
        useNavigation: false
    }

	render() {
		return <NotFound text={`Page ${this.props.match.params.splat} not found`} />
	}
}
