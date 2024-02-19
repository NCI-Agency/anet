import { gql } from "@apollo/client"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Messages from "components/Messages"
import Model from "components/Model"
import OrganizationTable from "components/OrganizationTable"
import { FastField, Form, Formik } from "formik"
import Organization from "models/Organization"
import Position from "models/Position"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Container, Modal, Row } from "react-bootstrap"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import Settings from "settings"
import utils from "utils"

const GQL_UPDATE_POSITION = gql`
  mutation ($position: PositionInput!) {
    updatePosition(position: $position)
  }
`

const EditOrganizationsAdministratedModal = ({
  position,
  showModal,
  onCancel,
  onSuccess
}) => {
  const [error, setError] = useState(null)

  const organizationsFilters = {
    allOrganizations: {
      label: "All organizations",
      queryVars: {
        status: Model.STATUS.ACTIVE
      }
    }
  }

  return (
    <Formik enableReinitialize onSubmit={onSubmit} initialValues={position}>
      {({ setFieldValue, values, submitForm, setFieldTouched }) => {
        const organizationsAdministratedSettings =
          Settings.fields.advisor.position.organizationsAdministrated
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
              <Messages error={error} />
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

  async function onSubmit(values, form) {
    try {
      await save(values, form)
      return onSuccess()
    } catch (error) {
      form.setSubmitting(false)
      setError(error)
    }
  }

  function save(values, form) {
    const position = Position.filterClientSideFields(new Position(values))
    return API.mutation(GQL_UPDATE_POSITION, { position })
  }
}

EditOrganizationsAdministratedModal.propTypes = {
  position: PropTypes.object.isRequired,
  showModal: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
}

export default EditOrganizationsAdministratedModal
