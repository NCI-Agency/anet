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

interface UserInputTableProps {
  fieldArrayName?: string
  users: any[]
}

const UserInputTable = ({
  fieldArrayName = "users",
  users
}: UserInputTableProps) => {
  return (
    <FieldArray name="users">
      {({ form, remove, push }) => (
        <>
          {_get(users, "length", 0) === 0 ? (
            <em className="clearfix">No domain username found</em>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Domain username</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const fieldName = `${fieldArrayName}.${i}.domainUsername`
                  const { className } = getFormGroupValidationState(
                    fieldName,
                    form,
                    "form-control"
                  )
                  return (
                    <tr key={u.uuid}>
                      <td className="input-group">
                        <Field
                          className={className}
                          name={fieldName}
                          value={u.domainUsername}
                        />
                        <RemoveButton
                          id={`clear-${fieldName}`}
                          title="Remove domain username"
                          onClick={() => remove(i)}
                        />
                        {getHelpBlock(fieldName, form)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
          <Button
            onClick={() => push({ domainUsername: "" })}
            variant="secondary"
            id={`add${fieldArrayName}Button`}
          >
            Add a domain username
          </Button>
        </>
      )}
    </FieldArray>
  )

  function clearUser(fieldName, form, replace, i) {
    const user = users[i]
    if (user) {
      user.domainUsername = ""
      replace(i, user)
      form.setFieldTouched(fieldName)
    }
  }
}

export default UserInputTable
