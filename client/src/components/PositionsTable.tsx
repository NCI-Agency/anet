import { Icon, IconSize } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import AssignPositionModal from "components/AssignPositionModal"
import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
import pluralize from "pluralize"
import React, { useState } from "react"
import { Button, Col, OverlayTrigger, Table, Tooltip } from "react-bootstrap"

interface PositionsTableProps {
  label: string
  person?: any
  positions?: any[]
  canEditPosition?: boolean
  canAssignPosition?: boolean
  updateCallback?: (...args: unknown[]) => unknown
}

const PositionsTable = ({
  label,
  person,
  positions,
  canEditPosition,
  canAssignPosition,
  updateCallback
}: PositionsTableProps) => {
  const [showAssignPositionModal, setShowAssignPositionModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const hasPositions = !_isEmpty(positions)
  const singleItemLabel = pluralize.singular(label)
  return (
    <>
      {hasPositions && (
        <Table striped hover responsive>
          <tbody>
            {positions?.map(pos => (
              <tr key={pos.uuid}>
                <td>
                  <LinkTo
                    modelType="Position"
                    model={pos}
                    className="position-name"
                  />{" "}
                  (
                  <LinkTo modelType="Organization" model={pos.organization} />)
                </td>
                {canEditPosition && (
                  <td className="w-25">
                    <Col sm={3} className="w-100">
                      <OverlayTrigger
                        key="edit-position-overlay"
                        placement="top"
                        overlay={
                          <Tooltip id="edit-position-tooltip">
                            Edit Position
                          </Tooltip>
                        }
                      >
                        <span className="edit-position">
                          <LinkTo
                            modelType="Position"
                            model={pos}
                            edit
                            button="primary"
                            showIcon={false}
                            showAvatar={false}
                          >
                            <Icon size={IconSize.LARGE} icon={IconNames.EDIT} />
                          </LinkTo>
                        </span>
                      </OverlayTrigger>
                      <OverlayTrigger
                        key="change-position-overlay"
                        placement="top"
                        overlay={
                          <Tooltip id="change-position-tooltip">
                            Change {singleItemLabel}
                          </Tooltip>
                        }
                      >
                        <Button
                          onClick={() => {
                            setSelectedPosition(pos)
                            setShowAssignPositionModal(true)
                          }}
                          className="change-assigned-position"
                        >
                          <Icon
                            size={IconSize.LARGE}
                            icon={IconNames.EXCHANGE}
                          />
                        </Button>
                      </OverlayTrigger>
                    </Col>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {(!hasPositions || canAssignPosition) && (
        <div className="w-100">
          <span>
            {!hasPositions && <em>No {label.toLowerCase()} assigned</em>}
          </span>
          {canAssignPosition && (
            <span className="w-25 float-end">
              <Col sm={3} className="w-100">
                <OverlayTrigger
                  key="assign-position-overlay"
                  placement="top"
                  overlay={
                    <Tooltip id="assign-position-tooltip">
                      Assign an {singleItemLabel}
                    </Tooltip>
                  }
                >
                  <Button
                    onClick={() => {
                      setSelectedPosition(null)
                      setShowAssignPositionModal(true)
                    }}
                  >
                    <Icon size={IconSize.LARGE} icon={IconNames.INSERT} />
                  </Button>
                </OverlayTrigger>
              </Col>
            </span>
          )}
        </div>
      )}

      {canAssignPosition && (
        <AssignPositionModal
          showModal={showAssignPositionModal}
          person={person}
          currentPosition={selectedPosition}
          primary={false}
          onCancel={() => hideAssignPositionModal(false)}
          onSuccess={() => hideAssignPositionModal(true)}
        />
      )}
    </>
  )

  function hideAssignPositionModal(success) {
    setShowAssignPositionModal(false)
    setSelectedPosition(null)
    if (success) {
      updateCallback?.()
    }
  }
}

export default PositionsTable
