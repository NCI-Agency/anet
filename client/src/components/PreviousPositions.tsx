import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

interface PreviousPositionsProps {
  history?: any[]
  action?: (...args: unknown[]) => unknown
}

function PreviousPositions({
  history: previousPositions,
  action
}: PreviousPositionsProps) {
  return _isEmpty(previousPositions) ? (
    <em>No positions found</em>
  ) : (
    <Table id="previous-positions" striped hover responsive>
      <thead>
        <tr>
          <th>Position</th>
          <th>Primary</th>
          <th>Dates</th>
          {action && <th>Action</th>}
        </tr>
      </thead>
      <tbody>
        {previousPositions.map((pp, idx) => (
          <tr key={idx} id={`previousPosition_${idx}`}>
            <td>
              <LinkTo modelType="Position" model={pp.position} />
            </td>
            <td>{pp.primary ? "✔️" : ""}</td>
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

export default PreviousPositions
