import { gql } from "@apollo/client"
import API from "api"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import { FastField, Field, Form, Formik } from "formik"
import _isEqual from "lodash/isEqual"
import { EventSeries, Organization } from "models"
import React, { useContext, useState } from "react"
import { Button } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"
import utils from "utils"

const GQL_CREATE_EVENTSERIES = gql`
  mutation ($eventSeries: EventSeriesInput!) {
    createEventSeries(eventSeries: $eventSeries) {
      uuid
    }
  }
`

const GQL_UPDATE_EVENTSERIES = gql`
  mutation ($eventSeries: EventSeriesInput!) {
    updateEventSeries(eventSeries: $eventSeries)
  }
`

interface EventSeriesFormProps {
  initialValues: any
  title?: string
  edit?: boolean
  notesComponent?: React.ReactNode
}

const EventSeriesForm = ({
  edit = false,
  title = "",
  initialValues,
  notesComponent
}: EventSeriesFormProps) => {
  const { loadAppData, currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const statusButtons = [
    {
      id: "statusActiveButton",
      value: Model.STATUS.ACTIVE,
      label: "Active"
    },
    {
      id: "statusInactiveButton",
      value: Model.STATUS.INACTIVE,
      label: "Inactive"
    }
  ]

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={EventSeries.yupSchema}
      initialValues={initialValues}
    >
      {({
        isSubmitting,
        dirty,
        setFieldValue,
        setFieldTouched,
        values,
        submitForm
      }) => {
        const isAdmin = currentUser?.isAdmin()
        const hostOrgSearchQuery = { status: Model.STATUS.ACTIVE }
        const adminOrgSearchQuery = { status: Model.STATUS.ACTIVE }
        // Superusers can select parent organizations among the ones their position is administrating
        if (!isAdmin) {
          const orgsAdministratedUuids =
            currentUser.position.organizationsAdministrated.map(org => org.uuid)
          adminOrgSearchQuery.parentOrgUuid = [
            currentUser.position.organization.uuid,
            ...orgsAdministratedUuids
          ]
          adminOrgSearchQuery.orgRecurseStrategy = RECURSE_STRATEGY.CHILDREN
        }

        const action = (
          <>
            <Button key="submit" variant="primary" onClick={submitForm}>
              Save Event Series
            </Button>
            {notesComponent}
          </>
        )
        const organizationFilters = {
          allOrganizations: {
            label: "All organizations",
            queryVars: { status: Model.STATUS.ACTIVE }
          }
        }

        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.eventSeries.name}
                  name="name"
                  component={FieldHelper.InputField}
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.eventSeries.hostOrg}
                  name="hostOrg"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("hostOrg", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("hostOrg", value)
                  }}
                  widget={
                    <AdvancedSingleSelect
                      fieldName="hostOrg"
                      placeholder={
                        Settings.fields.eventSeries.hostOrg.placeholder
                      }
                      value={values.hostOrg}
                      overlayColumns={["Name"]}
                      overlayRenderRow={OrganizationOverlayRow}
                      filterDefs={organizationFilters}
                      objectType={Organization}
                      fields={Organization.autocompleteQuery}
                      queryParams={hostOrgSearchQuery}
                      valueKey="shortName"
                      addon={ORGANIZATIONS_ICON}
                    />
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.eventSeries.adminOrg}
                  name="adminOrg"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("adminOrg", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("adminOrg", value)
                  }}
                  widget={
                    <AdvancedSingleSelect
                      fieldName="adminOrg"
                      placeholder={
                        Settings.fields.eventSeries.adminOrg.placeholder
                      }
                      value={values.adminOrg}
                      overlayColumns={["Name"]}
                      overlayRenderRow={OrganizationOverlayRow}
                      filterDefs={organizationFilters}
                      objectType={Organization}
                      fields={Organization.autocompleteQuery}
                      queryParams={adminOrgSearchQuery}
                      valueKey="shortName"
                      addon={ORGANIZATIONS_ICON}
                    />
                  }
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.eventSeries.status}
                  name="status"
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.eventSeries.description}
                  name="description"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // prevent initial unnecessary render of RichTextEditor
                    if (!_isEqual(values.description, value)) {
                      setFieldValue("description", value, true)
                    }
                  }}
                  onHandleBlur={() => {
                    // validation will be done by setFieldValue
                    setFieldTouched("description", true, false)
                  }}
                  widget={
                    <RichTextEditor
                      className="reportTextField"
                      placeholder={
                        Settings.fields.eventSeries.description?.placeholder
                      }
                    />
                  }
                />
              </Fieldset>
              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel} variant="outline-secondary">
                    Cancel
                  </Button>
                </div>
                <div>
                  <Button
                    id="formBottomSubmit"
                    variant="primary"
                    onClick={submitForm}
                    disabled={isSubmitting}
                  >
                    Save Event Series
                  </Button>
                </div>
              </div>
            </Form>
          </div>
        )
      }}
    </Formik>
  )

  function onCancel() {
    navigate(-1)
  }

  function onSubmit(values, form) {
    return save(values, form)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(response, values, form) {
    const operation = edit ? "updateEventSeries" : "createEventSeries"
    const eventSeries = new EventSeries({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
    })
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    loadAppData()
    if (!edit) {
      navigate(EventSeries.pathForEdit(eventSeries), { replace: true })
    }
    navigate(EventSeries.pathFor(eventSeries), {
      state: { success: "Event series saved" }
    })
  }

  function save(values, form) {
    const eventSeries = EventSeries.filterClientSideFields(
      new EventSeries(values)
    )
    // strip tasks fields not in data model
    eventSeries.hostOrg = utils.getReference(eventSeries.hostOrg)
    eventSeries.adminOrg = utils.getReference(eventSeries.adminOrg)
    return API.mutation(
      edit ? GQL_UPDATE_EVENTSERIES : GQL_CREATE_EVENTSERIES,
      { eventSeries }
    )
  }
}

export default EventSeriesForm
