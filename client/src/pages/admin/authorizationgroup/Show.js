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
		setMessages(props,this.state)
	}

	getPositionQueryPart(authGroupId) {
		let positionQuery = {
			pageNum: this.positionsPageNum,
			pageSize: 10,
			authorizationGroupId: authGroupId
		}
		let positionsPart = new GQL.Part(/* GraphQL */`
			paginatedPositions: positionList(query:$positionQuery) {
				pageNum, pageSize, totalCount, list { id , name, code, type, status, organization { id, shortName}, person { id, name } }
			}`)
			.addVariable("positionQuery", "PositionSearchQuery", positionQuery)
		return positionsPart
	}

	getReportQueryPart(authGroupId) {
		let reportQuery = {
			pageNum: this.reportsPageNum,
			pageSize: 10,
			authorizationGroupId: authGroupId
		}
		let reportsPart = new GQL.Part(/* GraphQL */`
			reports: reportList(query:$reportQuery) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}`)
			.addVariable("reportQuery", "ReportSearchQuery", reportQuery)
		return reportsPart
	}

	fetchData(props) {
		let authGroupPart = new GQL.Part(/* GraphQL */`
			authorizationGroup(id:${props.match.params.id}) {
			id, name, description
			positions { id , name, code, type, status, organization { id, shortName}, person { id, name } }
			status
		}` )
		let positionsPart = this.getPositionQueryPart(props.match.params.id)
		let reportsPart = this.getReportQueryPart(props.match.params.id)
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
		let positionQueryPart = this.getPositionQueryPart(this.state.authorizationGroup.id)
		GQL.run([positionQueryPart]).then(data =>
			this.setState({positions: data.paginatedPositions})
		)
	}

	@autobind
	goToReportsPage(pageNum) {
		this.reportsPageNum = pageNum
		let reportQueryPart = this.getReportQueryPart(this.state.authorizationGroup.id)
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
