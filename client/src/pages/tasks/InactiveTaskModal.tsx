import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import React, { useMemo, useState } from "react"
import { Button, Modal } from "react-bootstrap"

interface InactiveTaskModalProps {
  showModal?: boolean
  currentTask?: any
  tasks: any[]
  onSuccess: (...args: unknown[]) => unknown
  onCancel: (...args: unknown[]) => unknown
}

const InactiveTaskModal = ({
  showModal = true,
  currentTask,
  tasks,
  onSuccess,
  onCancel
}: InactiveTaskModalProps) => {
  return (
    <Modal centered show={showModal} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>Setting this task to inactive?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h6>The following tasks will be set to inactive:</h6>
        <ul>
          {tasks.map(task => (
            <li key={task.uuid}>
              <BreadcrumbTrail
                modelType="Task"
                key={task.uuid}
                leaf={task}
                ascendantObjects={task.ascendantTasks}
                ascendantTask={currentTask}
                parentField="parentTask"
                hideParents
              />
            </li>
          ))}
        </ul>
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <Button onClick={() => onCancel()} variant="outline-secondary">
          Cancel
        </Button>
        <Button onClick={onSuccess} variant="primary">
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default InactiveTaskModal
