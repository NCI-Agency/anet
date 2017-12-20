import React from 'react'
import Page from 'components/Page'

import PoamForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'
import NavigationWarning from 'components/NavigationWarning'

import API from 'api'
import dict from 'dictionary'
import {Poam,Organization} from 'models'

export default class PoamNew extends Page {
	static pageProps = {
		useNavigation: false
	}


	constructor(props) {
		super(props)

		this.state = {
			poam: new Poam(),
			originalPoam: new Poam()
		}
	}

	fetchData(props) {
		if (props.location.query.responsibleOrgId) {
			API.query(/* GraphQL */`
				organization(id: ${props.location.query.responsibleOrgId}) {
					id, shortName, longName, identificationCode, type
				}
			`).then(data => {
				let poam = this.state.poam
				poam.responsibleOrg = new Organization(data.organization)
				this.state.originalPoam.responsibleOrg = new Organization(data.organization)
				this.setState({poam})
			})
		}
	}

	render() {
		let poam = this.state.poam

		return (
			<div>
				<Breadcrumbs items={[['Create new ' + dict.lookup('POAM_SHORT_NAME'), Poam.pathForNew()]]} />

				<NavigationWarning original={this.state.originalPoam} current={poam} />
				<PoamForm poam={poam} />
			</div>
		)
	}
}
