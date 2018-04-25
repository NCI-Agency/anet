import PropTypes from 'prop-types'
import React from 'react'
import Page from 'components/Page'
import moment from 'moment'

import PersonForm from 'pages/people/Form'

import API from 'api'
import {Person} from 'models'

import { setPageProps, PAGE_PROPS_MIN_HEAD } from 'actions'
import { connect } from 'react-redux'

class OnboardingEdit extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
	}

	static modelName = 'User'

	constructor(props) {
		super(props, PAGE_PROPS_MIN_HEAD)

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

const mapDispatchToProps = (dispatch, ownProps) => ({
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export default connect(null, mapDispatchToProps)(OnboardingEdit)
