import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, jumpToTop, propTypes as pagePropTypes} from 'components/Page'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import Form from 'components/Form'
import Messages from 'components/Messages'

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
			success: null,
			error: null,
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
				<Messages success={this.state.success} error={this.state.error} />

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
		// settings as JSON
		let settings = Object.map(this.state.settings, (key, value) => ({key, value}))
		let graphql = 'saveAdminSettings(settings: $settings)'
		const variables = { settings: settings }
		const variableDef = '($settings: [AdminSettingInput]!)'
		API.mutation(graphql, variables, variableDef, {disableSubmits: true})
			.then(data => {
				this.setState({success: 'Admin settings saved', error: null})
				jumpToTop()
				this.props.loadAppData()
			}).catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
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
