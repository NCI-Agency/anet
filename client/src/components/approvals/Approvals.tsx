import AppContext from "components/AppContext"
import ApprovalSteps from "components/approvals/ApprovalSteps"
import Fieldset from "components/Fieldset"
import React, { useContext, useState } from "react"
import { Button } from "react-bootstrap"
import EditApprovalsModal from "./EditApprovalsModal"

interface ApprovalStepsEditProps {
  id: string
  title: string
  restrictedApprovalLabel?: string
  approvalSteps: any[]
  canEdit: boolean
  editLabel: string
  showModal?: boolean
  relatedObject: any
  objectType: "Location" | "Organization" | "Task"
  onClick: (...args: unknown[]) => unknown
  onCancel: (...args: unknown[]) => unknown
  onSuccess: (...args: unknown[]) => unknown
  fieldName: string
  addButtonLabel: string
  approversFilters: any
}

const ApprovalStepsEdit = ({
  id,
  title,
  restrictedApprovalLabel,
  approvalSteps,
  canEdit,
  editLabel,
  showModal,
  relatedObject,
  objectType,
  onClick,
  onCancel,
  onSuccess,
  fieldName,
  addButtonLabel,
  approversFilters
}: ApprovalStepsEditProps) => (
  <Fieldset
    id={id}
    title={title}
    action={
      canEdit && (
        <Button onClick={onClick} variant="outline-secondary">
          {editLabel}
        </Button>
      )
    }
  >
    <ApprovalSteps
      approvalSteps={approvalSteps}
      restrictedApprovalLabel={restrictedApprovalLabel}
    />
    {canEdit && (
      <EditApprovalsModal
        relatedObject={relatedObject}
        objectType={objectType}
        showModal={showModal}
        onCancel={onCancel}
        onSuccess={onSuccess}
        fieldName={fieldName}
        title={title}
        addButtonLabel={addButtonLabel}
        restrictedApprovalLabel={restrictedApprovalLabel}
        approversFilters={approversFilters}
      />
    )}
  </Fieldset>
)

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
  const { currentUser } = useContext(AppContext)
  const [showPlanningApprovalsModal, setShowPlanningApprovalsModal] =
    useState(false)
  const [showReportApprovalsModal, setShowReportApprovalsModal] =
    useState(false)

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
        organizationUuid: currentUser.position?.organization?.uuid
      }
    }
  }

  return (
    <div>
      <ApprovalStepsEdit
        id="planningApprovals"
        title="Engagement planning approval process"
        restrictedApprovalLabel={restrictedApprovalLabel}
        approvalSteps={relatedObject.planningApprovalSteps}
        canEdit={canEdit}
        editLabel="Edit Engagement planning approvals"
        showModal={showPlanningApprovalsModal}
        relatedObject={relatedObject}
        objectType={objectType}
        onClick={() => setShowPlanningApprovalsModal(true)}
        onCancel={() => setShowPlanningApprovalsModal(false)}
        onSuccess={() => {
          setShowPlanningApprovalsModal(false)
          refetch()
        }}
        fieldName="planningApprovalSteps"
        addButtonLabel="Add a Planning Approval Step"
        approversFilters={approversFilters}
      />
      <ApprovalStepsEdit
        id="approvals"
        title="Report publication approval process"
        restrictedApprovalLabel={restrictedApprovalLabel}
        approvalSteps={relatedObject.approvalSteps}
        canEdit={canEdit}
        editLabel="Edit Report publication approvals"
        showModal={showReportApprovalsModal}
        relatedObject={relatedObject}
        objectType={objectType}
        onClick={() => setShowReportApprovalsModal(true)}
        onCancel={() => setShowReportApprovalsModal(false)}
        onSuccess={() => {
          setShowReportApprovalsModal(false)
          refetch()
        }}
        fieldName="approvalSteps"
        addButtonLabel="Add a Publication Approval Step"
        approversFilters={approversFilters}
      />
    </div>
  )
}

export default Approvals
