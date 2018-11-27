import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import Form from 'components/Form'
import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages, {setMessages} from 'components/Messages'
import LinkTo from 'components/LinkTo'
import PositionTable from 'components/PositionTable'
import ReportCollection from 'components/ReportCollection'
import RelatedObjectNotes, {GRAPHQL_NOTES_FIELDS} from 'components/RelatedObjectNotes'

import {AuthorizationGroup, Person} from 'models'
import GQL from 'graphqlapi'
import autobind from 'autobind-decorator'

import AppContext from 'components/AppContext'
import { connect } from 'react-redux'

class BaseAuthorizationGroupShow extends Page {

	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
	}

	constructor(props) {
		super(props)

		this.state = {
			authorizationGroup: new AuthorizationGroup(),
			positions: null,
			reports: null
		}
		this.positionsPageNum = 0
		this.reportsPageNum = 0
		setMessages(props,this.state)
	}

	getPositionQueryPart(authGroupUuid) {
		let positionQuery = {
			pageNum: this.positionsPageNum,
			pageSize: 10,
			authorizationGroupUuid: authGroupUuid
		}
		let positionsPart = new GQL.Part(/* GraphQL */`
			paginatedPositions: positionList(query:$positionQuery) {
				pageNum, pageSize, totalCount, list { uuid, name, code, type, status, organization { uuid, shortName}, person { uuid, name } }
			}`)
			.addVariable("positionQuery", "PositionSearchQueryInput", positionQuery)
		return positionsPart
	}

	getReportQueryPart(authGroupUuid) {
		let reportQuery = {
			pageNum: this.reportsPageNum,
			pageSize: 10,
			authorizationGroupUuid: authGroupUuid
		}
		let reportsPart = new GQL.Part(/* GraphQL */`
			reports: reportList(query:$reportQuery) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}`)
			.addVariable("reportQuery", "ReportSearchQueryInput", reportQuery)
		return reportsPart
	}

	fetchData(props) {
		let authGroupPart = new GQL.Part(/* GraphQL */`
			authorizationGroup(uuid:"${props.match.params.uuid}") {
			uuid, name, description
			positions { uuid, name, code, type, status, organization { uuid, shortName}, person { uuid, name } }
			status
			${GRAPHQL_NOTES_FIELDS}
		}` )
		let positionsPart = this.getPositionQueryPart(props.match.params.uuid)
		let reportsPart = this.getReportQueryPart(props.match.params.uuid)
		return this.runGQL([authGroupPart, positionsPart, reportsPart])
	}

	runGQL(queries) {
		return GQL.run(queries).then(data => {
			this.setState({
				authorizationGroup: new AuthorizationGroup(data.authorizationGroup),
				positions: data.paginatedPositions,
				reports: data.reports
			})
		})
	}

	render() {
		let authorizationGroup = this.state.authorizationGroup
		const { currentUser } = this.props
		return (
			<div>
				<RelatedObjectNotes notes={authorizationGroup.notes} relatedObject={authorizationGroup.uuid && {relatedObjectType: 'authorizationGroups', relatedObjectUuid: authorizationGroup.uuid}} />
				<Breadcrumbs items={[[authorizationGroup.name, AuthorizationGroup.pathFor(authorizationGroup)]]} />
				<Messages success={this.state.success} error={this.state.error} />

				<Form static formFor={authorizationGroup} horizontal >
					<Fieldset title={authorizationGroup.name} action={currentUser.isSuperUser() && <LinkTo authorizationGroup={authorizationGroup} edit button="primary">Edit</LinkTo>}>
						<Form.Field id="description" />
						<Form.Field id="status">{authorizationGroup.humanNameOfStatus()}</Form.Field>
					</Fieldset>
					<Fieldset title="Positions">
						<PositionTable
							paginatedPositions={this.state.positions}
							goToPage={this.goToPositionsPage}
						/>
					</Fieldset>
					<Fieldset title="Reports">
						<ReportCollection
							paginatedReports={this.state.reports}
							goToPage={this.goToReportsPage}
						/>
					</Fieldset>
				</Form>
			</div>
		)
	}

	@autobind
	goToPositionsPage(pageNum) {
		this.positionsPageNum = pageNum
		let positionQueryPart = this.getPositionQueryPart(this.state.authorizationGroup.uuid)
		GQL.run([positionQueryPart]).then(data =>
			this.setState({positions: data.paginatedPositions})
		)
	}

	@autobind
	goToReportsPage(pageNum) {
		this.reportsPageNum = pageNum
		let reportQueryPart = this.getReportQueryPart(this.state.authorizationGroup.uuid)
		GQL.run([reportQueryPart]).then(data =>
			this.setState({reports: data.reports})
		)
	}

}

const AuthorizationGroupShow = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseAuthorizationGroupShow currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(AuthorizationGroupShow)
