import { gql } from "@apollo/client"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import { MessagesWithConflict } from "components/Messages"
import OrganizationTable from "components/OrganizationTable"
import { FastField, Form, Formik } from "formik"
import { Organization, Position } from "models"
import React, { useState } from "react"
import { Button, Col, Container, Modal, Row } from "react-bootstrap"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import Settings from "settings"
import utils from "utils"

const GQL_UPDATE_POSITION = gql`
  mutation ($position: PositionInput!, $force: Boolean) {
    updatePosition(position: $position, force: $force)
  }
`

interface EditOrganizationsAdministratedModalProps {
  position: any
  showModal?: boolean
  onCancel: (...args: unknown[]) => unknown
  onSuccess: (...args: unknown[]) => unknown
}

const EditOrganizationsAdministratedModal = ({
  position,
  showModal,
  onCancel,
  onSuccess
}: EditOrganizationsAdministratedModalProps) => {
  const [error, setError] = useState(null)

  const organizationsFilters = {
    allOrganizations: {
      label: "All organizations"
    }
  }

  return (
    <Formik enableReinitialize onSubmit={onSubmit} initialValues={position}>
      {({
        setFieldValue,
        values,
        submitForm,
        setFieldTouched,
        resetForm,
        setSubmitting
      }) => {
        const organizationsAdministratedSettings =
          Settings.fields.position.organizationsAdministrated
        return (
          <Modal
            centered
            show={showModal}
            onHide={() => close(setFieldValue)}
            size="lg"
            style={{ zIndex: "1300" }}
          >
            <Modal.Header closeButton>
              <Modal.Title>
                Edit {utils.noCase(organizationsAdministratedSettings.label)}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <MessagesWithConflict
                error={error}
                objectType="Position"
                onCancel={() => close(setFieldValue)}
                onConfirm={() => {
                  resetForm({ values, isSubmitting: true })
                  onSubmit(values, { resetForm, setSubmitting }, true)
                }}
              />
              <Form className="form-horizontal" method="post">
                <Container fluid>
                  <Row>
                    <Col md={12}>
                      <DictionaryField
                        wrappedComponent={FastField}
                        dictProps={organizationsAdministratedSettings}
                        name="organizationsAdministrated"
                        component={FieldHelper.SpecialField}
                        onChange={value => {
                          // validation will be done by setFieldValue
                          value = value.map(organization =>
                            Organization.filterClientSideFields(organization)
                          )
                          setFieldTouched(
                            "organizationsAdministrated",
                            true,
                            false
                          ) // onBlur doesn't work when selecting an option
                          setFieldValue("organizationsAdministrated", value)
                        }}
                        vertical
                        widget={
                          <AdvancedMultiSelect
                            fieldName="organizationsAdministrated"
                            value={values.organizationsAdministrated}
                            renderSelected={
                              <OrganizationTable
                                organizations={
                                  values.organizationsAdministrated || []
                                }
                                noOrganizationsMessage="No organizations selected"
                                showDelete
                              />
                            }
                            overlayColumns={["Organization"]}
                            overlayRenderRow={OrganizationOverlayRow}
                            filterDefs={organizationsFilters}
                            objectType={Organization}
                            fields={Organization.autocompleteQuery}
                            addon={ORGANIZATIONS_ICON}
                          />
                        }
                      />
                    </Col>
                  </Row>
                </Container>
              </Form>
            </Modal.Body>
            <Modal.Footer className="justify-content-between">
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
        )
      }}
    </Formik>
  )

  function close(setFieldValue) {
    // Reset state before closing (cancel)
    setError(null)
    setFieldValue(
      "organizationsAdministrated",
      position.organizationsAdministrated
    )
    onCancel()
  }

  async function onSubmit(values, form, force) {
    try {
      await save(values, form, force)
      return onSuccess()
    } catch (error) {
      form.setSubmitting(false)
      setError(error)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
  function save(values, form, force) {
    const position = Position.filterClientSideFields(new Position(values))
    return API.mutation(GQL_UPDATE_POSITION, { position, force })
  }
}

export default EditOrganizationsAdministratedModal
