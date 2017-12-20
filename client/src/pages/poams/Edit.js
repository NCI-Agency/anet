import React from 'react'
import Page from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'
import NavigationWarning from 'components/NavigationWarning'

import PoamForm from './Form'

import API from 'api'
import dict from 'dictionary'
import {Poam} from 'models'

export default class PoamEdit extends Page {
	static pageProps = {
		useNavigation: false
	}


	static modelName = 'PoAM'

	constructor(props) {
		super(props)

		this.state = {
			poam: new Poam(),
			originalPoam: new Poam()
		}
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			poam(id:${props.params.id}) {
				id, shortName, longName, status,
				responsibleOrg {id,shortName, longName, identificationCode}
			}
		`).then(data => {
			this.setState({poam: new Poam(data.poam), originalPoam: new Poam(data.poam)})
		})
	}

	render() {
		let poam = this.state.poam

		return (
			<div>
				<Breadcrumbs items={[[`${dict.lookup('POAM_SHORT_NAME')} ${poam.shortName}`, Poam.pathFor(poam)], ["Edit", Poam.pathForEdit(poam)]]} />

				<Messages error={this.state.error} success={this.state.success} />

				<NavigationWarning original={this.state.originalPoam} current={poam} />
				<PoamForm poam={poam} edit />
			</div>
		)
	}
}
