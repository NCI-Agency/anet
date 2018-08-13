import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import Form from 'components/Form'

import API from 'api'

import AppContext from 'components/AppContext'
import { connect } from 'react-redux'

class BaseAdminIndex extends Page {

	static propTypes = {
		...pagePropTypes,
		loadAppData: PropTypes.func,
	}

	constructor(props) {
		super(props)

		this.state = {
			settings: {},
		}
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			adminSettings { key, value }
		`).then(data => {
			let settings = {}
			data.adminSettings.forEach(setting => settings[setting.key] = setting.value)
			this.setState({settings})
		})
	}

	render() {
		let {settings} = this.state

		return (
			<div>
				<Breadcrumbs items={[['Admin settings', '/admin']]} />

				<Form formFor={settings} horizontal submitText="Save settings" onChange={this.onChange} onSubmit={this.onSubmit}>
					<Fieldset title="Site settings">
						{Object.map(settings, (key, value) =>
							<Form.Field id={key} key={key} />
						)}
					</Fieldset>
				</Form>
			</div>
		)
	}

	@autobind
	onChange(event) {
		let settings = this.state.settings
		this.setState({settings})
	}

	@autobind
	onSubmit(event) {
		event.stopPropagation()
		event.preventDefault()

		let json = Object.map(this.state.settings, (key, value) => ({key, value}))

        API.send('/api/admin/save', json, {disableSubmits: true})
            .then(() => {
				this.props.loadAppData()
			})
			.catch(error => {
                this.setState({error})
                window.scrollTo(0, 0)
				console.error(error)
            })
	}

}

const AdminIndex = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseAdminIndex loadAppData={context.loadAppData} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(AdminIndex)
