import { gql } from "@apollo/client"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import { customFieldsJSONString } from "components/CustomFields"
import * as FieldHelper from "components/FieldHelper"
import Messages from "components/Messages"
import Model from "components/Model"
import PositionTable from "components/PositionTable"
import { FastField, Form, Formik } from "formik"
import DictionaryField from "HOC/DictionaryField"
import Organization from "models/Organization"
import Position from "models/Position"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Container, Modal, Row } from "react-bootstrap"
import POSITIONS_ICON from "resources/positions.png"
import Settings from "settings"
import utils from "utils"

const GQL_UPDATE_ORGANIZATION = gql`
  mutation ($organization: OrganizationInput!) {
    updateOrganization(organization: $organization)
  }
`

const EditAdministratingPositionsModal = ({
  organization,
  showModal,
  onCancel,
  onSuccess
}) => {
  const [error, setError] = useState(null)
  organization.administratingPositions =
    (organization.administratingPositions ||
      organization.ascendantOrgs?.find(o => o.uuid === organization.uuid)
        ?.administratingPositions) ??
    []

  const DictFastField = DictionaryField(FastField)
  const positionsFilters = {
    allAdvisorPositions: {
      label: "All advisor positions",
      queryVars: {
        status: Model.STATUS.ACTIVE,
        type: [Position.TYPE.SUPERUSER],
        matchPersonName: true
      }
    }
  }

  return (
    <Formik enableReinitialize onSubmit={onSubmit} initialValues={organization}>
      {({ setFieldValue, values, submitForm, setFieldTouched }) => {
        const isAdvisorOrg = values.type === Organization.TYPE.ADVISOR_ORG
        const orgSettings = isAdvisorOrg
          ? Settings.fields.advisor.org
          : Settings.fields.principal.org
        return (
          <Modal
            centered
            show={showModal}
            onHide={() => close(setFieldValue)}
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                Edit {utils.noCase(orgSettings.administratingPositions.label)}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Messages error={error} />
              <Form className="form-horizontal" method="post">
                <Container fluid>
                  <Row>
                    <Col md={12}>
                      <DictFastField
                        dictProps={orgSettings.administratingPositions}
                        name="administratingPositions"
                        component={FieldHelper.SpecialField}
                        onChange={value => {
                          // validation will be done by setFieldValue
                          value = value.map(position =>
                            Position.filterClientSideFields(position)
                          )
                          setFieldTouched(
                            "administratingPositions",
                            true,
                            false
                          ) // onBlur doesn't work when selecting an option
                          setFieldValue("administratingPositions", value)
                        }}
                        vertical
                        widget={
                          <AdvancedMultiSelect
                            fieldName="administratingPositions"
                            value={values.administratingPositions}
                            renderSelected={
                              <PositionTable
                                positions={values.administratingPositions || []}
                                showDelete
                              />
                            }
                            overlayColumns={[
                              "Position",
                              "Organization",
                              "Current Occupant"
                            ]}
                            overlayRenderRow={PositionOverlayRow}
                            filterDefs={positionsFilters}
                            objectType={Position}
                            fields={Position.autocompleteQuery}
                            addon={POSITIONS_ICON}
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
      "administratingPositions",
      organization.administratingPositions
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
    const organization = Organization.filterClientSideFields(
      new Organization(values)
    )
    // strip tasks fields not in data model
    organization.tasks = values.tasks.map(t => utils.getReference(t))
    organization.parentOrg = utils.getReference(organization.parentOrg)
    organization.customFields = customFieldsJSONString(values)
    return API.mutation(GQL_UPDATE_ORGANIZATION, { organization })
  }
}

EditAdministratingPositionsModal.propTypes = {
  organization: PropTypes.object.isRequired,
  showModal: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
}

export default EditAdministratingPositionsModal
