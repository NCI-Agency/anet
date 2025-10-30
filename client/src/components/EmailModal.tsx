import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import AppContext from "components/AppContext"
import EmailAddressList from "components/EmailAddressList"
import * as FieldHelper from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import { Field, Form } from "formik"
import { Person } from "models"
import React, { useContext } from "react"
import { FormText, Modal } from "react-bootstrap"
import PEOPLE_ICON from "resources/people.png"
import Settings from "settings"
import utils from "utils"

const EMAIL_NETWORK = Settings.emailNetworkForNotifications || null

interface EmailModalProps {
  title: string
  footer: React.ReactNode
  selectedUsers: any[]
  onChange: (values: any[]) => void
  showEmailModal: boolean
  toggleEmailModal: () => void
}

export const EmailModal = ({
  title,
  footer,
  selectedUsers,
  onChange,
  showEmailModal,
  toggleEmailModal
}: EmailModalProps) => {
  const { currentUser } = useContext(AppContext)
  const currentUserAuthorizationGroupUuids =
    currentUser.authorizationGroups?.map(ag => ag.uuid) ?? []
  const authorizationGroupUuids =
    Settings.fields.person.emailAddresses?.authorizationGroupUuids
  const currentUserIsAuthorized =
    authorizationGroupUuids == null ||
    currentUserAuthorizationGroupUuids.some(agu =>
      authorizationGroupUuids.includes(agu)
    )
  const canPickPersonEmail =
    // admins can see all emailAddresses
    currentUser.isAdmin() ||
    // superusers can see at least some emailAddresses
    currentUser.isSuperuser() ||
    // authorized users can see all emailAddresses
    currentUserIsAuthorized

  const peopleFilters = {
    allPeople: {
      label: "All people",
      queryVars: {
        emailNetwork: EMAIL_NETWORK
      }
    }
  }

  const getUserPillInfo = (user: any) => {
    const email = user.emailAddresses?.find(
      ea => ea.network === EMAIL_NETWORK
    )?.address
    return `${user.name}${email ? ` <${email}>` : ""}`
  }

  const personFields = `${Person.autocompleteQuery} emailAddresses(network: "${EMAIL_NETWORK}") { network address }`
  return (
    <Modal centered show={showEmailModal} onHide={toggleEmailModal}>
      <Form>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {EMAIL_NETWORK && canPickPersonEmail && (
            <>
              <Field
                name="toAnetUsers"
                label="To ANET Users"
                component={FieldHelper.SpecialField}
                vertical
                onChange={onChange}
                widget={
                  <AdvancedMultiSelect
                    fieldName="author"
                    placeholder="Select ANET users"
                    value={selectedUsers}
                    overlayColumns={[
                      "Email",
                      "Name",
                      "Position",
                      "Location",
                      "Organization"
                    ]}
                    overlayRenderRow={ToAnetUsersOverlayRow}
                    filterDefs={peopleFilters}
                    autoComplete="off"
                    objectType={Person}
                    fields={personFields}
                    addon={PEOPLE_ICON}
                    disableCheckboxIfNullPath="emailAddresses"
                  />
                }
              />
              <div className="d-flex flex-wrap gap-2 mb-2 mt-2">
                {selectedUsers.map(user => (
                  <div
                    className="d-flex align-items-center p-2 gap-2 border border-secondary rounded"
                    key={user.uuid}
                  >
                    {getUserPillInfo(user)}
                    <Icon
                      icon={IconNames.CROSS}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        onChange(
                          selectedUsers?.filter(u => u.uuid !== user.uuid)
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </>
          )}
          <Field
            name="to"
            label="To Emails"
            component={FieldHelper.InputField}
            validate={email => handleEmailValidation(email, selectedUsers)}
            vertical
          >
            <FormText>
              One or more email addresses, comma separated, e.g.:
              <br />
              <em>
                jane@nowhere.invalid, John Doe &lt;john@example.org&gt;, "Mr. X"
                &lt;x@example.org&gt;
              </em>
            </FormText>
          </Field>
          <Field
            name="comment"
            component={FieldHelper.InputField}
            asA="textarea"
            vertical
          />
        </Modal.Body>
        <Modal.Footer>{footer}</Modal.Footer>
      </Form>
    </Modal>
  )

  function handleEmailValidation(value, toAnetUsers) {
    const r = utils.parseEmailAddresses(value)
    return r.isValid || toAnetUsers.length ? null : r.message
  }
}

const ToAnetUsersOverlayRow = (item: any) => (
  <React.Fragment key={item.uuid}>
    <td>
      <EmailAddressList
        label={Settings.fields.person.emailAddresses.label}
        emailAddresses={item.emailAddresses}
      />
    </td>
    <td>
      <LinkTo modelType="Person" model={item} isLink={false} />
    </td>
    <td>
      <LinkTo modelType="Position" model={item.position} isLink={false} />
      {item.position?.code ? `, ${item.position.code}` : ""}
    </td>
    <td>
      <LinkTo
        modelType="Location"
        model={item.position?.location}
        whenUnspecified=""
      />
    </td>
    <td>
      {item.position?.organization && (
        <LinkTo
          modelType="Organization"
          model={item.position?.organization}
          isLink={false}
        />
      )}
    </td>
  </React.Fragment>
)
