import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import moment from 'moment'

import PersonForm from 'pages/people/Form'

import API from 'api'
import {Person} from 'models'

import AppContext from 'components/AppContext'
import { PAGE_PROPS_MIN_HEAD } from 'actions'
import { connect } from 'react-redux'

class BaseOnboardingEdit extends Page {

	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
	}

	static modelName = 'User'

	constructor(props) {
		super(props, PAGE_PROPS_MIN_HEAD)

		this.state = {
			person: new Person(),
		}
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			person(id:${props.currentUser.id}) {
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

const OnboardingEdit = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseOnboardingEdit currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(OnboardingEdit)
