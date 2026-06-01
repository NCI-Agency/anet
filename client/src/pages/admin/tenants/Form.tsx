import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { PersonSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AppContext from "components/AppContext"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import {
  getFormGroupValidationState,
  getHelpBlock
} from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import { MessagesWithConflict } from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import NoPaginationPersonTable from "components/NoPaginationPersonTable"
import ObjectHistory from "components/ObjectHistory"
import { jumpToTop } from "components/Page"
import RemoveButton from "components/RemoveButton"
import { FastField, Field, FieldArray, Form, Formik } from "formik"
import { Person, Tenant } from "models"
import React, { useContext, useMemo, useState } from "react"
import { Button } from "react-bootstrap"
import { useNavigate } from "react-router"
import PEOPLE_ICON from "resources/people.png"
import Settings from "settings"

const GQL_CREATE_TENANT = gql`
  mutation ($tenant: TenantInput!) {
    createTenant(tenant: $tenant) {
      uuid
    }
  }
`
const GQL_UPDATE_TENANT = gql`
  mutation ($tenant: TenantInput!, $force: Boolean) {
    updateTenant(tenant: $tenant, force: $force)
  }
`

interface EmailAddressInputTableProps {
  emailAddresses: any[]
}

const EmailAddressInputTable = ({
  emailAddresses
}: EmailAddressInputTableProps) => (
  <FieldArray name="emailAddresses">
    {({ form, push, remove }) => (
      <>
        {emailAddresses?.map((ea, i) => {
          const fieldName = `emailAddresses.${i}`
          const { className } = getFormGroupValidationState(
            fieldName,
            form,
            "form-control"
          )
          return (
            <div key={i} className="input-group">
              <Field className={className} name={fieldName} value={ea} />
              <RemoveButton
                id={`remove-${fieldName}`}
                title="Remove email address"
                onClick={() => remove(i)}
              />
              {getHelpBlock(fieldName, form)}
            </div>
          )
        })}
        <Button
          id="add-emailAddresses"
          title="Add email address"
          variant="secondary"
          onClick={() => push("")}
        >
          <Icon icon={IconNames.ADD} />
        </Button>
      </>
    )}
  </FieldArray>
)

interface TenantFormProps {
  initialValues: Tenant
  title?: string
  edit?: boolean
}

const TenantForm = ({
  edit = false,
  title = "",
  initialValues
}: TenantFormProps) => {
  const navigate = useNavigate()
  const { loadAppData } = useContext(AppContext)
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
  const peopleFilters = {
    allPersons: {
      label: "All",
      queryVars: {
        pendingVerification: false,
        isUser: true
      }
    }
  }

  const normalizedInitialValues = useMemo(
    () => new Tenant(initialValues),
    [initialValues]
  )

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Tenant.yupSchema}
      initialValues={normalizedInitialValues}
    >
      {({
        isSubmitting,
        dirty,
        setFieldValue,
        setFieldTouched,
        values,
        resetForm,
        setSubmitting,
        submitForm
      }) => {
        const action = (
          <>
            <Button
              key="submit"
              variant="primary"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save Tenant
            </Button>
            {edit && <ObjectHistory objectUuid={values.uuid} />}
          </>
        )
        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <MessagesWithConflict
              error={error}
              objectType="Tenant"
              onCancel={onCancel}
              onConfirm={() => {
                resetForm({ values, isSubmitting: true })
                onSubmit(values, { resetForm, setSubmitting }, true)
              }}
            />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.tenant.name}
                  name="name"
                  component={FieldHelper.InputField}
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.tenant.status}
                  name="status"
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  as="div"
                  dictProps={Settings.fields.tenant.emailAddresses}
                  component={FieldHelper.SpecialField}
                  onChange={value => setFieldValue("emailAddresses", value)}
                  widget={
                    <EmailAddressInputTable
                      emailAddresses={values.emailAddresses}
                    />
                  }
                />

                <Field
                  name="members"
                  label="Members"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("members", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("members", value, true)
                  }}
                  widget={
                    <AdvancedMultiSelect
                      fieldName="members"
                      placeholder="Search for people…"
                      value={values.members}
                      renderSelected={
                        <NoPaginationPersonTable
                          id="tenants-members"
                          people={values.members}
                          showDelete
                        />
                      }
                      overlayColumns={["Name"]}
                      overlayRenderRow={PersonSimpleOverlayRow}
                      filterDefs={peopleFilters}
                      objectType={Person}
                      fields={Person.autocompleteQuery}
                      addon={PEOPLE_ICON}
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
                    Save Tenant
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

  function onSubmit(values, form, force) {
    return save(values, form, force)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  async function onSubmitSuccess(response, values, form) {
    const operation = edit ? "updateTenant" : "createTenant"
    const tenant = new Tenant({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
    })
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    await loadAppData()
    if (!edit) {
      navigate(Tenant.pathForEdit(tenant), { replace: true })
    }
    navigate(Tenant.pathFor(tenant), {
      state: { success: "Tenant saved" }
    })
  }

  function save(values, form, force) {
    const tenant = Tenant.filterClientSideFields(values)
    tenant.members = tenant.members.map(m => Person.filterClientSideFields(m))
    return API.mutation(edit ? GQL_UPDATE_TENANT : GQL_CREATE_TENANT, {
      tenant,
      force
    })
  }
}

export default TenantForm
