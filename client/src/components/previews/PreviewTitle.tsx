import Model from "components/Model"
import React from "react"
import { Badge } from "react-bootstrap"

interface StatusBadgeProps {
  status?: string
}

const StatusBadge = ({ status }: StatusBadgeProps) =>
  status === Model.STATUS.INACTIVE ? (
    <Badge bg="secondary" className="ms-2 me-2 fs-6 align-self-baseline">
      {Model.humanNameOfStatus(status)}
    </Badge>
  ) : null

interface PreviewTitleProps {
  title: string
  status?: string
}

export const PreviewTitle = ({ title, status }: PreviewTitleProps) => (
  <div className="preview-sticky-title d-flex justify-content-between">
    <h4 className="ellipsized-text">{title}</h4>
    <StatusBadge status={status} />
  </div>
)
