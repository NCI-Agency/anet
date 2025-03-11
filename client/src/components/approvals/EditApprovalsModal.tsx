import { gql } from "@apollo/client"
import API from "api"
import AppContext from "components/AppContext"
import ApprovalsDefinition from "components/approvals/ApprovalsDefinition"
import Messages from "components/Messages"
import { Form, Formik } from "formik"
import { Organization } from "models"
import React, { useContext, useState } from "react"
import { Button, Modal } from "react-bootstrap"

const GQL_UPDATE_ORGANIZATION = gql`
  mutation ($organization: OrganizationInput!) {
    updateOrganization(organization: $organization)
  }
`
interface EditApprovalsModalProps {
  organization: any
  showModal?: boolean
  onCancel: (...args: unknown[]) => unknown
  onSuccess: (...args: unknown[]) => unknown
  fieldName: string
  title: string
  addButtonLabel: string
}

const EditApprovalsModal = ({
  organization,
  showModal,
  onCancel,
  onSuccess,
  fieldName,
  title,
  addButtonLabel
}: EditApprovalsModalProps) => {
  const { currentUser } = useContext(AppContext)
  const [error, setError] = useState(null)

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
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      initialValues={{
        [fieldName]: organization[fieldName] || []
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
            <Form>
              <ApprovalsDefinition
                fieldName={fieldName}
                values={values}
                addButtonLabel={addButtonLabel}
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
    setFieldValue(fieldName, organization[fieldName] || [])
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
    const updatedOrganization = {
      ...organization,
      [fieldName]: values[fieldName]
    }
    const organizationInput =
      Organization.filterClientSideFields(updatedOrganization)
    return API.mutation(GQL_UPDATE_ORGANIZATION, {
      organization: organizationInput
    })
  }
}

export default EditApprovalsModal
