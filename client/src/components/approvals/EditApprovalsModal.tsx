import { gql } from "@apollo/client"
import API from "api"
import ApprovalsDefinition from "components/approvals/ApprovalsDefinition"
import Messages from "components/Messages"
import { Form, Formik } from "formik"
import { Location, Organization, Task } from "models"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"

const GQL_UPDATE_LOCATION = gql`
  mutation ($location: LocationInput!) {
    updateLocation(location: $location)
  }
`
const GQL_UPDATE_ORGANIZATION = gql`
  mutation ($organization: OrganizationInput!) {
    updateOrganization(organization: $organization)
  }
`
const GQL_UPDATE_TASK = gql`
  mutation ($task: TaskInput!) {
    updateTask(task: $task)
  }
`

interface EditApprovalsModalProps {
  relatedObject: any
  objectType: "Location" | "Organization" | "Task"
  showModal?: boolean
  onCancel: (...args: unknown[]) => unknown
  onSuccess: (...args: unknown[]) => unknown
  fieldName: string
  title: string
  addButtonLabel: string
  restrictedApprovalLabel?: string
  approversFilters: any
}

const EditApprovalsModal = ({
  relatedObject,
  objectType,
  showModal,
  onCancel,
  onSuccess,
  fieldName,
  title,
  addButtonLabel,
  restrictedApprovalLabel,
  approversFilters
}: EditApprovalsModalProps) => {
  const [error, setError] = useState(null)

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      initialValues={{
        [fieldName]: relatedObject[fieldName] || []
      }}
    >
      {({ values, setFieldValue, setFieldTouched, submitForm }) => (
        <Modal
          show={showModal}
          onHide={() => close(setFieldValue)}
          size="xl"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit {title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Messages error={error} />
            <Form className="form-horizontal">
              <ApprovalsDefinition
                fieldName={fieldName}
                values={values}
                addButtonLabel={addButtonLabel}
                restrictedApprovalLabel={restrictedApprovalLabel}
                setFieldValue={setFieldValue}
                setFieldTouched={setFieldTouched}
                approversFilters={approversFilters}
              />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={() => close(setFieldValue)}
              variant="outline-secondary"
            >
              Cancel
            </Button>
            <Button onClick={submitForm} variant="primary">
              Save
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Formik>
  )

  function close(setFieldValue) {
    // Reset state before closing (cancel)
    setError(null)
    setFieldValue(fieldName, relatedObject[fieldName] || [])
    onCancel()
  }

  async function onSubmit(values, form) {
    try {
      await save(values, form)
      setError(null)
      onSuccess()
    } catch (error) {
      form.setSubmitting(false)
      setError(error)
    }
  }

  function save(values, form) {
    const updatedObject = {
      ...relatedObject,
      [fieldName]: values[fieldName]
    }
    let mutation, filterFunction, inputKey, excludeFields

    switch (objectType) {
      case "Location":
        mutation = GQL_UPDATE_LOCATION
        filterFunction = Location.filterClientSideFields
        inputKey = "location"
        excludeFields = []
        break
      case "Organization":
        mutation = GQL_UPDATE_ORGANIZATION
        filterFunction = Organization.filterClientSideFields
        inputKey = "organization"
        excludeFields = []
        break
      case "Task":
        mutation = GQL_UPDATE_TASK
        filterFunction = Task.filterClientSideFields
        inputKey = "task"
        excludeFields = ["childrenTasks", "descendantTasks"]
        break
      default:
        return
    }

    const input = filterFunction(updatedObject, ...excludeFields)
    const variables = { [inputKey]: input }
    return API.mutation(mutation, variables)
  }
}

export default EditApprovalsModal
