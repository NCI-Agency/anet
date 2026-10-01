import {
  getFormGroupValidationState,
  getHelpBlock
} from "components/FieldHelper"
import RemoveButton from "components/RemoveButton"
import { Field, FieldArray } from "formik"
import _get from "lodash/get"
import React from "react"
import { Button, Table } from "react-bootstrap"
import Settings from "settings"

export const OTHER_PHONE_NUMBER_TYPE = "Other"

export const getPhoneNumberTypes = () =>
  (Settings.fields.person.phoneNumber?.types || []).filter(
    type => type.toLowerCase() !== OTHER_PHONE_NUMBER_TYPE.toLowerCase()
  )

const getDefaultPhoneNumberType = () => getPhoneNumberTypes()[0] || ""

export const initializePhoneNumbers = phoneNumber => phoneNumber || []

interface PhoneNumberInputTableProps {
  fieldArrayName?: string
  phoneNumber?: any[]
}

const PhoneNumberInputTable = ({
  fieldArrayName = "phoneNumber",
  phoneNumber
}: PhoneNumberInputTableProps) => {
  const presetTypes = getPhoneNumberTypes()
  return (
    <FieldArray name={fieldArrayName}>
      {({ form, remove, push }) => (
        <>
          {_get(phoneNumber, "length", 0) === 0 ? (
            <em className="clearfix">No phone number found</em>
          ) : (
            <Table striped hover>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Number</th>
                </tr>
              </thead>
              <tbody>
                {phoneNumber.map((pn, i) => {
                  const typeFieldName = `${fieldArrayName}.${i}.type`
                  const detailsFieldName = `${fieldArrayName}.${i}.details`
                  const isPresetType = presetTypes.includes(pn.type)
                  const { className: typeClassName } =
                    getFormGroupValidationState(
                      typeFieldName,
                      form,
                      "form-control"
                    )
                  const { className: detailsClassName } =
                    getFormGroupValidationState(
                      detailsFieldName,
                      form,
                      "form-control"
                    )
                  return (
                    <tr key={i}>
                      <td>
                        <select
                          id={`${typeFieldName}-preset`}
                          className="form-select"
                          aria-label="Phone number type"
                          value={
                            isPresetType ? pn.type : OTHER_PHONE_NUMBER_TYPE
                          }
                          onChange={e =>
                            changePhoneNumberType(
                              typeFieldName,
                              form,
                              e.target.value
                            )
                          }
                        >
                          {presetTypes.map(type => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                          <option value={OTHER_PHONE_NUMBER_TYPE}>
                            {OTHER_PHONE_NUMBER_TYPE}
                          </option>
                        </select>
                        {!isPresetType && (
                          <>
                            <Field
                              className={`${typeClassName} mt-1`}
                              name={typeFieldName}
                              placeholder="Specify type"
                              value={pn.type || ""}
                            />
                            {getHelpBlock(typeFieldName, form)}
                          </>
                        )}
                      </td>
                      <td className="input-group">
                        <Field
                          className={detailsClassName}
                          name={detailsFieldName}
                          value={pn.details}
                        />
                        <RemoveButton
                          id={`clear-${detailsFieldName}`}
                          title="Remove phone number"
                          onClick={() => remove(i)}
                        />
                        {getHelpBlock(detailsFieldName, form)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
          <Button
            onClick={() =>
              push({ type: getDefaultPhoneNumberType(), details: "" })
            }
            variant="secondary"
            id={`add${fieldArrayName}Button`}
          >
            Add a phone number
          </Button>
        </>
      )}
    </FieldArray>
  )

  function changePhoneNumberType(typeFieldName, form, value) {
    form.setFieldValue(
      typeFieldName,
      value === OTHER_PHONE_NUMBER_TYPE ? "" : value
    )
    form.setFieldTouched(typeFieldName)
  }
}

export default PhoneNumberInputTable
