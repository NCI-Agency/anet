import React, {PropTypes} from 'react'
import Page from 'components/Page'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import Form from 'components/Form'
import LinkTo from 'components/LinkTo'
import Messages, {setMessages} from 'components/Messages'
import ReportCollection from 'components/ReportCollection'

import dict from 'dictionary'
import GQL from 'graphqlapi'
import {Poam} from 'models'

export default class PoamShow extends Page {
	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
		app: PropTypes.object.isRequired,
	}

	static modelName = 'PoAM'

	constructor(props) {
		super(props)

		this.state = {
			poam: new Poam({
				id: props.params.id,
				shortName: props.params.shorName,
				longName: props.params.longName,
				responsibleOrg: props.params.responsibleOrg
			}),
			reportsPageNum: 0,
		}

		setMessages(props,this.state)
	}

	fetchData(props) {
		let reportsQuery = new GQL.Part(/* GraphQL */`
			reports: reportList(query: $reportsQuery) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}
		`).addVariable("reportsQuery", "ReportSearchQuery", {
			pageSize: 10,
			pageNum: this.state.reportsPageNum,
			poamId: props.params.id,
		})

		let poamQuery = new GQL.Part(/* GraphQL */`
			poam(id:${props.params.id}) {
				id, shortName, longName, status,
				responsibleOrg {id, shortName, longName, identificationCode}
			}
		`)

		GQL.run([reportsQuery, poamQuery]).then(data => {
            this.setState({
                poam: new Poam(data.poam),
				reports: data.reports,
            })
        })
	}

	render() {
		let {poam, reports} = this.state
		// Admins can edit poams, or super users if this poam is assigned to their org.
		let currentUser = this.context.currentUser
		let poamShortName = dict.lookup("POAM_SHORT_NAME")

		let canEdit = currentUser.isAdmin() ||
			(poam.responsibleOrg && currentUser.isSuperUserForOrg(poam.responsibleOrg))

		return (
			<div>
				<Breadcrumbs items={[[`${poamShortName} ${poam.shortName}`, Poam.pathFor(poam)]]} />
				<Messages success={this.state.success} error={this.state.error} />

				<Form static formFor={poam} horizontal>
					<Fieldset title={`${poamShortName} ${poam.shortName}`} action={canEdit && <LinkTo poam={poam} edit button="primary">Edit</LinkTo>}>
						<Form.Field id="shortName" label={`${poamShortName} number`} />
						<Form.Field id="longName" label={`${poamShortName} description`} />
						<Form.Field id="status" />
						{poam.responsibleOrg && poam.responsibleOrg.id && this.renderOrg()}
					</Fieldset>
				</Form>

				<Fieldset title={`Reports for this ${poamShortName}`}>
					<ReportCollection paginatedReports={reports} goToPage={this.goToReportsPage} />
				</Fieldset>
			</div>
		)
	}

    @autobind
    renderOrg() {
		let responsibleOrg = this.state.poam.responsibleOrg
		return (
			<Form.Field id="responsibleOrg" label="Responsible Organization" >
				<LinkTo organization={responsibleOrg}>
					{responsibleOrg.shortName} {responsibleOrg.longName}
				</LinkTo>
			</Form.Field>
		)
	}

	@autobind
	goToReportsPage(pageNum) {
		this.setState({reportsPageNum: pageNum}, () => this.loadData())
	}
}
