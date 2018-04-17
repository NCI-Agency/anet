import React from 'react'
import PropTypes from 'prop-types'
import Checkbox from 'components/Checkbox'
import _uniqueId from 'lodash/uniqueId'

const _advisorStats = (columnGroups, statistics) => {
    let stats = []
    columnGroups.forEach( (group, index) => {
        let rowCell = statistics[index]
        let keySubmitted = _uniqueId('submitted_')
        let keyAttended = _uniqueId('attended_')
        if(rowCell) {
            stats.push(<td key={ keySubmitted }>{ rowCell.nrReportsSubmitted }</td>)
            stats.push(<td key={ keyAttended }>{ rowCell.nrEngagementsAttended }</td>)
        }
        else {
            stats.push(<td key={ keySubmitted }>0</td>)
            stats.push(<td key={ keyAttended }>0</td>)
        }
    })
    return stats
}

const AdvisorReportsRow = (props) => {
    let statistics = _advisorStats(props.columnGroups, props.row.stats)
    let checkbox = (props.onSelectRow) ? <td><Checkbox checked={ props.checked } onChange={ props.onSelectRow } /></td> : null
    let description = (props.handleOrganizationClick) ? props.link : props.row.name
    return (
        <tr>
            {checkbox}
            <td>{description}</td>
            {statistics}
        </tr>
    )
}

AdvisorReportsRow.propTypes = {
    checked: PropTypes.bool,
    columnGroups: PropTypes.array,
    handleOrganizationClick: PropTypes.func,
    link: PropTypes.object,
    onSelectRow: PropTypes.func,
    row: PropTypes.object,
}

export default AdvisorReportsRow
