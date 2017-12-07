import React, {Component, PropTypes} from 'react'
import {Table, Pagination} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import LinkTo from 'components/LinkTo'
import dict from 'dictionary'

import {Poam} from 'models'

export default class OrganizationPoams extends Component {
	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	render() {
		let currentUser = this.context.app.state.currentUser

		let org = this.props.organization
		if (!org.isAdvisorOrg()) {
			return <div></div>
		}

		let poams = this.props.poams.list || []
		let isAdminUser = currentUser && currentUser.isAdmin()
		let poamShortName = dict.lookup('POAM_SHORT_NAME')

		return <Fieldset id="poams" title={poamShortName} action={
			isAdminUser && <LinkTo poam={Poam.pathForNew({responsibleOrgId: org.id})} button>Create {poamShortName}</LinkTo>
		}>
			{this.pagination()}
			<Table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Description</th>
					</tr>
				</thead>

				<tbody>
					{Poam.map(poams, (poam, idx) =>
						<tr key={poam.id} id={`poam_${idx}`} >
							<td><LinkTo poam={poam} >{poam.shortName}</LinkTo></td>
							<td>{poam.longName}</td>
						</tr>
					)}
				</tbody>
			</Table>

			{poams.length === 0 && <em>This organization doesn't have any {poamShortName}s</em>}
		</Fieldset>
	}

	@autobind
	pagination() {
		let goToPage = this.props.goToPage
		let {pageSize, pageNum, totalCount} = this.props.poams
		let numPages = Math.ceil(totalCount / pageSize)
		if (numPages < 2 ) { return }
		return <header className="searchPagination" ><Pagination
			className="pull-right"
			prev
			next
			items={numPages}
			ellipsis
			maxButtons={6}
			activePage={pageNum + 1}
			onSelect={(value) => goToPage(value - 1)}
		/></header>
	}
}
