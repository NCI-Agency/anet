import React, {PropTypes} from 'react'
import Page from 'components/Page'
import moment from 'moment'

import PersonForm from 'pages/people/Form'

import API from 'api'
import {Person} from 'models'

export default class OnboardingEdit extends Page {
	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
	}

	static pageProps = {
		useNavigation: false,
		minimalHeader: true,
	}

	static modelName = 'User'

	constructor(props, context) {
		super(props)

		this.state = {
			person: new Person(),
		}
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			person(id:${this.context.currentUser.id}) {
				id,
				name, rank, role, emailAddress, phoneNumber, status
				biography, country, gender, endOfTourDate, domainUsername
				position {
					id, name
				}
			}
		`).then(data => {
			if (data.person.endOfTourDate) {
				data.person.endOfTourDate = moment(data.person.endOfTourDate).format()
			}

			this.setState({person: new Person(data.person)})
		})
	}

	render() {
		return <div>
			<PersonForm
				person={this.state.person} edit
				legendText={"Create your account"}
				saveText={"Create profile"}
			/>
		</div>
	}
}
