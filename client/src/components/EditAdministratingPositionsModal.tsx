import { gql } from "@apollo/client"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import { customFieldsJSONString } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import { MessagesWithConflict } from "components/Messages"
import PositionTable from "components/PositionTable"
import { FastField, Form, Formik } from "formik"
import { Organization, Position } from "models"
import React, { useState } from "react"
import { Button, Col, Container, Modal, Row } from "react-bootstrap"
import POSITIONS_ICON from "resources/positions.png"
import Settings from "settings"
import utils from "utils"

const GQL_UPDATE_ORGANIZATION = gql`
  mutation ($organization: OrganizationInput!, $force: Boolean) {
    updateOrganization(organization: $organization, force: $force)
  }
`

interface EditAdministratingPositionsModalProps {
  organization: any
  showModal?: boolean
  onCancel: (...args: unknown[]) => unknown
  onSuccess: (...args: unknown[]) => unknown
}

const EditAdministratingPositionsModal = ({
  organization,
  showModal,
  onCancel,
  onSuccess
}: EditAdministratingPositionsModalProps) => {
  const [error, setError] = useState(null)
  organization.administratingPositions =
    (organization.administratingPositions ||
      organization.ascendantOrgs?.find(o => o.uuid === organization.uuid)
        ?.administratingPositions) ??
    []

  const positionsFilters = {
    allSuperuserPositions: {
      label: "All superuser positions",
      queryVars: {
        type: [Position.TYPE.SUPERUSER],
        matchPersonName: true
      }
    }
  }

  return (
    <Formik enableReinitialize onSubmit={onSubmit} initialValues={organization}>
      {({
        setFieldValue,
        values,
        submitForm,
        setFieldTouched,
        resetForm,
        setSubmitting
      }) => {
        return (
          <Modal
            backdrop="static"
            centered
            show={showModal}
            onHide={() => close(setFieldValue)}
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                Edit{" "}
                {utils.noCase(
                  Settings.fields.organization.administratingPositions.label
                )}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <MessagesWithConflict
                error={error}
                objectType="Organization"
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
                        dictProps={
                          Settings.fields.organization.administratingPositions
                        }
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
                                showLocation
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
    const organization = Organization.filterClientSideFields(
      new Organization(values)
    )
    // strip tasks fields not in data model
    organization.tasks = values.tasks.map(t => utils.getReference(t))
    organization.parentOrg = utils.getReference(organization.parentOrg)
    organization.customFields = customFieldsJSONString(values)
    return API.mutation(GQL_UPDATE_ORGANIZATION, { organization, force })
  }
}

export default EditAdministratingPositionsModal
