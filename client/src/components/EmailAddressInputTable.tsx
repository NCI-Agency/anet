import {
  getFormGroupValidationState,
  getHelpBlock
} from "components/FieldHelper"
import RemoveButton from "components/RemoveButton"
import { Field, FieldArray } from "formik"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

export const initializeEmailAddresses = emailAddresses =>
  Settings.emailNetworks.map(network => ({
    network,
    address: emailAddresses?.find(e => e.network === network)?.address || ""
  }))

interface EmailAddressInputTableProps {
  fieldArrayName?: string
  emailAddresses: any[]
}

const EmailAddressInputTable = ({
  fieldArrayName = "emailAddresses",
  emailAddresses
}: EmailAddressInputTableProps) => {
  return (
    <Table striped hover responsive>
      <thead>
        <tr>
          <th>Network</th>
          <th>Address</th>
        </tr>
      </thead>
      <tbody>
        <FieldArray name="emailAddresses">
          {({ form, replace }) =>
            emailAddresses.map((e, i) => {
              const fieldName = `${fieldArrayName}.${i}.address`
              const { className } = getFormGroupValidationState(
                fieldName,
                form,
                "form-control"
              )
              return (
                <tr key={e.network}>
                  <td style={{ verticalAlign: "middle" }}>{e.network}</td>
                  <td className="input-group">
                    <Field
                      className={className}
                      name={fieldName}
                      value={e.address}
                    />
                    <RemoveButton
                      id={`clear-${fieldName}`}
                      title="Clear address"
                      onClick={() =>
                        clearEmailAddress(fieldName, form, replace, i)
                      }
                    />
                    {getHelpBlock(fieldName, form)}
                  </td>
                </tr>
              )
            })
          }
        </FieldArray>
      </tbody>
    </Table>
  )

  function clearEmailAddress(fieldName, form, replace, i) {
    const emailAddress = emailAddresses[i]
    if (emailAddress) {
      emailAddress.address = ""
      replace(i, emailAddress)
      form.setFieldTouched(fieldName)
    }
  }
}

export default EmailAddressInputTable
