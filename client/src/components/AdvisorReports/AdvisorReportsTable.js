import React from 'react'
import PropTypes from 'prop-types'
import { Table } from 'react-bootstrap'
import AdvisorReportsTableHead from 'components/AdvisorReports/AdvisorReportsTableHead'
import AdvisorReportsRow from 'components/AdvisorReports/AdvisorReportsRow'
import _uniqueId from 'lodash/uniqueId'
import {Settings} from 'api'

const AdvisorReportsTable = (props) => {
    let rows = props.data.map( (advisor) => {
        return (<AdvisorReportsRow
            row={ advisor }
            columnGroups={ props.columnGroups }
            key={ _uniqueId(`${advisor.uuid}_`) } />)
    })
    return(
        <Table striped bordered condensed hover responsive>
            <caption>Shows reports submitted and engagements attended per week for each {Settings.fields.advisor.person.name} in the organization</caption>
            <AdvisorReportsTableHead
                title={Settings.fields.advisor.person.name}
                columnGroups={ props.columnGroups } />
            <tbody>
                { rows }
            </tbody>
        </Table>
    )
}

AdvisorReportsTable.propTypes = {
    columnGroups: PropTypes.array,
    data: PropTypes.array,
}

export default AdvisorReportsTable
