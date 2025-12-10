import { Icon, IconSize } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import React from "react"
import { Button, OverlayTrigger, Table, Tooltip } from "react-bootstrap"
import Settings from "settings"

interface PreviousPositionsProps {
  history?: any[]
  showPrimaryFlag?: boolean
  canEditHistory?: boolean
  action?: (...args: unknown[]) => unknown
}

function PreviousPositions({
  history: previousPositions,
  showPrimaryFlag = true,
  canEditHistory,
  action
}: PreviousPositionsProps) {
  return _isEmpty(previousPositions) ? (
    <em>No positions found</em>
  ) : (
    <>
      <Table id="previous-positions" striped hover responsive>
        <thead>
          <tr>
            <th>Position</th>
            <th>Dates</th>
          </tr>
        </thead>
        <tbody>
          {previousPositions.map((pp, idx) => (
            <tr key={idx} id={`previousPosition_${idx}`}>
              <td>
                {showPrimaryFlag && pp.primary && "✔️ "}
                <LinkTo modelType="Position" model={pp.position} />
              </td>
              <td>
                {moment(pp.startTime).format(
                  Settings.dateFormats.forms.displayShort.date
                )}{" "}
                -{" "}
                {pp.endTime &&
                  moment(pp.endTime).format(
                    Settings.dateFormats.forms.displayShort.date
                  )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {canEditHistory && (
        <div className="w-100">
          <div className="float-end">
            <OverlayTrigger
              key="edit-history-overlay"
              placement="top"
              overlay={
                <Tooltip id="edit-history-tooltip">Edit history</Tooltip>
              }
            >
              <Button onClick={action} className="edit-history float-end">
                <Icon size={IconSize.LARGE} icon={IconNames.EDIT} />
              </Button>
            </OverlayTrigger>
          </div>
        </div>
      )}
    </>
  )
}

export default PreviousPositions
