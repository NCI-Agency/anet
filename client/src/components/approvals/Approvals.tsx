import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import React, { useContext, useState } from "react"
import { Button, FormCheck, Table } from "react-bootstrap"
import EditApprovalsModal from "./EditApprovalsModal"

interface ApprovalsProps {
  restrictedApprovalLabel?: string
  relatedObject: any
  objectType: "Location" | "Organization" | "Task"
  canEdit: boolean
  refetch: (...args: unknown[]) => unknown
}

const Approvals = ({
  restrictedApprovalLabel,
  relatedObject,
  objectType,
  canEdit,
  refetch
}: ApprovalsProps) => {
  const { planningApprovalSteps, approvalSteps } = relatedObject
  const [showPlanningApprovalsModal, setShowPlanningApprovalsModal] =
    useState(false)
  const [showReportApprovalsModal, setShowReportApprovalsModal] =
    useState(false)
  const { currentUser } = useContext(AppContext)

  const approversFilters = {
    allPositions: {
      label: "All positions",
      queryVars: {
        matchPersonName: true
      }
    }
  }
  if (currentUser.position) {
    approversFilters.myColleagues = {
      label: "My colleagues",
      queryVars: {
        matchPersonName: true,
        organizationUuid: currentUser.position.organization.uuid
      }
    }
  }

  return (
    <div>
      <Fieldset
        id="planningApprovals"
        title="Engagement planning approval process"
        action={
          canEdit && (
            <Button
              onClick={() => setShowPlanningApprovalsModal(true)}
              variant="outline-secondary"
            >
              Edit Engagement planning approvals
            </Button>
          )
        }
      >
        {planningApprovalSteps.map((step, idx) => (
          <Fieldset title={`Step ${idx + 1}: ${step.name}`} key={"step_" + idx}>
            {restrictedApprovalLabel && (
              <FormCheck
                type="checkbox"
                label={restrictedApprovalLabel}
                checked={step.restrictedApproval}
                readOnly
              />
            )}
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Position</th>
                </tr>
              </thead>

              <tbody>
                {step.approvers.map((position, approverIdx) => (
                  <tr
                    key={`${step.uuid}_${position.uuid}`}
                    id={`step_${idx}_approver_${approverIdx}`}
                  >
                    {position.person && position.person.uuid ? (
                      <td>
                        <LinkTo modelType="Person" model={position.person} />
                      </td>
                    ) : (
                      <td className="text-danger">Unfilled</td>
                    )}
                    <td>
                      <LinkTo modelType="Position" model={position} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Fieldset>
        ))}

        {planningApprovalSteps.length === 0 && (
          <em>
            This object doesn't have any engagement planning approval steps
          </em>
        )}
      </Fieldset>
      <Fieldset
        id="approvals"
        title="Report publication approval process"
        action={
          canEdit && (
            <Button
              onClick={() => setShowReportApprovalsModal(true)}
              variant="outline-secondary"
            >
              Edit Report publication approvals
            </Button>
          )
        }
      >
        {approvalSteps.map((step, idx) => (
          <Fieldset title={`Step ${idx + 1}: ${step.name}`} key={"step_" + idx}>
            {restrictedApprovalLabel && (
              <FormCheck
                type="checkbox"
                label={restrictedApprovalLabel}
                checked={step.restrictedApproval}
                readOnly
              />
            )}
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Position</th>
                </tr>
              </thead>

              <tbody>
                {step.approvers.map((position, approverIdx) => (
                  <tr
                    key={`${step.uuid}_${position.uuid}`}
                    id={`step_${idx}_approver_${approverIdx}`}
                  >
                    {position.person && position.person.uuid ? (
                      <td>
                        <LinkTo modelType="Person" model={position.person} />
                      </td>
                    ) : (
                      <td className="text-danger">Unfilled</td>
                    )}
                    <td>
                      <LinkTo modelType="Position" model={position} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Fieldset>
        ))}

        {approvalSteps.length === 0 && (
          <em>
            This object doesn't have any report publication approval steps
          </em>
        )}
      </Fieldset>
      {canEdit && (
        <>
          <EditApprovalsModal
            relatedObject={relatedObject}
            objectType={objectType}
            showModal={showPlanningApprovalsModal}
            onCancel={() => setShowPlanningApprovalsModal(false)}
            onSuccess={() => {
              setShowPlanningApprovalsModal(false)
              refetch()
            }}
            fieldName="planningApprovalSteps"
            title="Engagement planning approval process"
            addButtonLabel="Add a Planning Approval Step"
            approversFilters={approversFilters}
          />
          <EditApprovalsModal
            relatedObject={relatedObject}
            objectType={objectType}
            showModal={showReportApprovalsModal}
            onCancel={() => setShowReportApprovalsModal(false)}
            onSuccess={() => {
              setShowReportApprovalsModal(false)
              refetch()
            }}
            fieldName="approvalSteps"
            title="Report publication approval process"
            addButtonLabel="Add a Publication Approval Step"
            approversFilters={approversFilters}
          />
        </>
      )}
    </div>
  )
}

export default Approvals
