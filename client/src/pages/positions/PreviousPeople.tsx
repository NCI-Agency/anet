import { Icon, IconSize } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import React from "react"
import { Badge, Button, OverlayTrigger, Table, Tooltip } from "react-bootstrap"
import Settings from "settings"

interface PreviousPeopleProps {
  history?: any[]
  showPrimaryFlag?: boolean
  canEditHistory?: boolean
  action?: (...args: unknown[]) => unknown
}

function PreviousPeople({
  history: previousPeople = [],
  showPrimaryFlag = true,
  canEditHistory,
  action
}: PreviousPeopleProps) {
  return _isEmpty(previousPeople) ? (
    <em>No people found</em>
  ) : (
    <>
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Dates</th>
            <th></th>
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
                -{" "}
                {pp.endTime &&
                  moment(pp.endTime).format(
                    Settings.dateFormats.forms.displayShort.date
                  )}
              </td>
              <td>
                {showPrimaryFlag && pp.primary && (
                  <Badge bg="primary">Primary</Badge>
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

export default PreviousPeople
