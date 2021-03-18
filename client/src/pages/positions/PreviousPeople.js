import LinkTo from "components/LinkTo"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

function PreviousPeople({ history: previousPeople, action }) {
  return (
    <Table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Dates</th>
          {action && <th>Action</th>}
        </tr>
      </thead>
      <tbody>
        {previousPeople.map((pp, idx) => (
          <tr key={idx} id={`previousPerson_${idx}`}>
            <td>
              <LinkTo modelType="Person" model={pp.person} />
            </td>
            <td>
              {moment(pp.startTime).format(
                Settings.dateFormats.forms.displayShort.date
              )}{" "}
              - &nbsp;
              {pp.endTime &&
                moment(pp.endTime).format(
                  Settings.dateFormats.forms.displayShort.date
                )}
            </td>
            {action && <td>{action(pp, idx)}</td>}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

PreviousPeople.propTypes = {
  history: PropTypes.array,
  action: PropTypes.func
}

export default PreviousPeople
