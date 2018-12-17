import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, jumpToTop, propTypes as pagePropTypes} from 'components/Page'
import {Button} from 'react-bootstrap'

import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'
import Messages from 'components/Messages'

import API from 'api'

import AppContext from 'components/AppContext'
import { connect } from 'react-redux'

class BaseAdminIndex extends Page {

	static propTypes = {
		...pagePropTypes,
		loadAppData: PropTypes.func,
	}

	state = {
		success: null,
		error: null,
		settings: {},
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
				<Formik
					enableReinitialize
					onSubmit={this.onSubmit}
					initialValues={settings}
				>
				{({
					values,
					isSubmitting,
					submitForm
				}) => {
					const action = <div>
						<Button bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting}>Save settings</Button>
					</div>
					return <Form className="form-horizontal" method="post">
						<Fieldset title="Site settings" action={action} />
						<Fieldset>
							{Object.map(settings, (key, value) =>
								<Field
									key={key}
									name={key}
									component={FieldHelper.renderInputField} />
							)}
						</Fieldset>
						<div className="submit-buttons">
							<div></div>
							{action}
						</div>
					</Form>
					}
				}
				</Formik>
			</div>
		)
	}

	onSubmit = (values, form) => {
		return this.save(values, form)
			.then(response => this.onSubmitSuccess(response, values, form))
			.catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
				console.error(error)
			})
	}

	onSubmitSuccess = (response, values, form) => {
		// After successful submit, reset the form in order to make sure the dirty
		// prop is also reset (otherwise we would get a blocking navigation warning)
		form.resetForm()
		this.setState({success: 'Admin settings saved', error: null})
		jumpToTop()
		this.props.loadAppData()
	}

	save = (values, form) => {
		// settings as JSON
		let settings = Object.map(values, (key, value) => ({key, value}))
		let graphql = 'saveAdminSettings(settings: $settings)'
		const variables = { settings: settings }
		const variableDef = '($settings: [AdminSettingInput]!)'
		return API.mutation(graphql, variables, variableDef)
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
