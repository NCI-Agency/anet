import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import ConfirmDestructive from "components/ConfirmDestructive"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import { yupDate } from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { FastField, Form, Formik } from "formik"
import _get from "lodash/get"
import { clone } from "lodash/lang"
import moment from "moment"
import React, { useState } from "react"
import {
  Button,
  Col,
  Modal,
  OverlayTrigger,
  Table,
  Tooltip
} from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"
import * as yup from "yup"

const GQL_GET_ACCESS_TOKEN_LIST = gql`
  query {
    accessTokenList {
      uuid
      name
      description
      createdAt
      expiresAt
    }
  }
`

const GQL_CREATE_ACCESS_TOKEN = gql`
  mutation ($accessToken: AccessTokenInput!) {
    createAccessToken(accessToken: $accessToken)
  }
`

const GQL_DELETE_ACCESS_TOKEN = gql`
  mutation ($accessToken: AccessTokenInput!) {
    deleteAccessToken(accessToken: $accessToken)
  }
`

const GQL_UPDATE_ACCESS_TOKEN = gql`
  mutation ($accessToken: AccessTokenInput!) {
    updateAccessToken(accessToken: $accessToken)
  }
`

const yupSchema = yup.object().shape({
  name: yup
    .string()
    .required("You must give an access token a name")
    .default(""),
  description: yup.string().nullable().default(""),
  expiresAt: yupDate
    .nullable()
    .required("You must give an access token an expiration")
    .default(null)
})

function createShortcut(label: string, date: Date, includeTime: boolean) {
  return { date, includeTime, label }
}

function createExpirationShortcuts(withTime: boolean) {
  const now = new Date()
  const makeDate = (action: (d: Date) => void) => {
    const date = clone(now)
    action(date)
    return date
  }

  return [
    createShortcut(
      "1 week",
      makeDate((d: Date) => d.setDate(d.getDate() + 7)),
      withTime
    ),
    createShortcut(
      "1 month",
      makeDate((d: Date) => d.setMonth(d.getMonth() + 1)),
      withTime
    ),
    createShortcut(
      "3 months",
      makeDate((d: Date) => d.setMonth(d.getMonth() + 3)),
      withTime
    ),
    createShortcut(
      "6 months",
      makeDate((d: Date) => d.setMonth(d.getMonth() + 6)),
      withTime
    ),
    createShortcut(
      "1 year",
      makeDate((d: Date) => d.setFullYear(d.getFullYear() + 1)),
      withTime
    ),
    createShortcut(
      "2 years",
      makeDate((d: Date) => d.setFullYear(d.getFullYear() + 2)),
      withTime
    ),
    createShortcut(
      "5 years",
      makeDate((d: Date) => d.setFullYear(d.getFullYear() + 5)),
      withTime
    ),
    createShortcut(
      "10 years",
      makeDate((d: Date) => d.setFullYear(d.getFullYear() + 10)),
      withTime
    )
  ]
}

interface AccessTokensTableProps {
  accessTokens?: any[]
  onDelete: (...args: unknown[]) => unknown
  onUpdate: (...args: unknown[]) => unknown
}

const AccessTokensTable = ({
  accessTokens,
  onDelete,
  onUpdate
}: AccessTokensTableProps) => {
  const [currentAccessToken, setCurrentAccessToken] = useState({})
  const [showUpdateAccessTokenDialog, setShowUpdateAccessTokenDialog] =
    useState(false)

  if (_get(accessTokens, "length", 0) === 0) {
    return <em>No access tokens found</em>
  }

  return (
    <>
      <Table striped hover responsive className="accessTokens_table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Created</th>
            <th>Expires</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {accessTokens.map(at => (
            <tr key={at.uuid}>
              <td>{at.name}</td>
              <td>{at.description}</td>
              <td>
                {moment(at.createdAt).format(
                  Settings.dateFormats.forms.displayShort.withTime
                )}
              </td>
              <td>
                {moment(at.expiresAt).format(
                  Settings.dateFormats.forms.displayShort.withTime
                )}
              </td>
              <td style={{ verticalAlign: "middle" }}>
                <ConfirmDestructive
                  onConfirm={() => onDelete(at)}
                  objectType="access token"
                  objectDisplay={at.name}
                  variant="outline-danger"
                  buttonSize="xs"
                  buttonTitle="Delete access token"
                >
                  <Icon icon={IconNames.TRASH} />
                </ConfirmDestructive>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Update access token</Tooltip>}
                >
                  <Button
                    variant="outline-info"
                    size="xs"
                    className="ms-1"
                    onClick={() => {
                      setCurrentAccessToken(at)
                      setShowUpdateAccessTokenDialog(true)
                    }}
                  >
                    <Icon icon={IconNames.CALENDAR} />
                  </Button>
                </OverlayTrigger>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <AccessTokenModal
        accessToken={currentAccessToken}
        title="Update access token"
        show={showUpdateAccessTokenDialog}
        setShow={setShowUpdateAccessTokenDialog}
        onConfirm={values => {
          setShowUpdateAccessTokenDialog(false)
          onUpdate(values)
        }}
      />
    </>
  )
}

function b64(array) {
  return btoa(String.fromCharCode(...array))
}

function getRandomBytes(nrBytes) {
  const array = new Uint8Array(nrBytes)
  crypto.getRandomValues(array)
  return array
}

interface AccessTokenModalProps {
  accessToken?: any
  isNew?: boolean
  title: string
  show: boolean
  setShow: (...args: unknown[]) => unknown
  onConfirm: (...args: unknown[]) => unknown
}

const AccessTokenModal = ({
  accessToken,
  isNew,
  title,
  show,
  setShow,
  onConfirm
}: AccessTokenModalProps) => {
  if (isNew) {
    accessToken = {
      name: "",
      description: null,
      expiresAt: null,
      tokenValue: b64(getRandomBytes(24))
    }
  }

  return (
    <Formik
      enableReinitialize
      initialValues={accessToken}
      validationSchema={yupSchema}
      onSubmit={onConfirm}
    >
      {({ isSubmitting, setFieldValue, setFieldTouched, submitForm }) => (
        <Modal centered size="lg" show={show} onHide={() => setShow(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              <Form className="form-horizontal" method="post">
                <Fieldset>
                  <FastField
                    name="name"
                    label="Name"
                    component={FieldHelper.InputField}
                    extraColElem={null}
                  />
                  <FastField
                    name="description"
                    label="Description"
                    component={FieldHelper.InputField}
                    extraColElem={null}
                    asA="textarea"
                  />
                  <FastField
                    name="expiresAt"
                    label="Expires"
                    component={FieldHelper.SpecialField}
                    extraColElem={null}
                    onChange={value => {
                      setFieldTouched("expiresAt", true, false) // onBlur doesn't work when selecting a date
                      setFieldValue("expiresAt", value, true)
                    }}
                    onBlur={() => setFieldTouched("expiresAt")}
                    widget={
                      <CustomDateInput
                        id="expiresAt"
                        withTime
                        shortcuts={createExpirationShortcuts(true)}
                      />
                    }
                  />
                  {isNew && (
                    <FastField
                      name="tokenValue"
                      label="Token value"
                      component={FieldHelper.InputField}
                      disabled
                      addon={
                        <p>
                          This is the new access token; make sure to copy it
                          now. You won’t be able to see it again!
                        </p>
                      }
                      extraColElem={
                        <>
                          <OverlayTrigger
                            placement="top"
                            trigger="click"
                            overlay={
                              <Tooltip>
                                Token value copied to clipboard!
                              </Tooltip>
                            }
                          >
                            <Button
                              variant="outline-secondary"
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  accessToken.tokenValue
                                )}
                            >
                              <Icon icon={IconNames.DUPLICATE} />
                            </Button>
                          </OverlayTrigger>
                        </>
                      }
                    />
                  )}
                </Fieldset>
              </Form>
            </div>
          </Modal.Body>
          <Modal.Footer className="justify-content-between">
            <Col>
              <Button
                className="float-start"
                variant="outline-secondary"
                onClick={() => setShow(false)}
              >
                Cancel
              </Button>
            </Col>
            <Col>
              <Button
                className="float-end"
                variant="primary"
                onClick={submitForm}
                disabled={isSubmitting}
              >
                Save
              </Button>
            </Col>
          </Modal.Footer>
        </Modal>
      )}
    </Formik>
  )
}

interface AccessTokensListProps {
  pageDispatchers?: PageDispatchersPropType
}

const AccessTokensList = ({ pageDispatchers }: AccessTokensListProps) => {
  const [stateSuccess, setStateSuccess] = useState(null)
  const [stateError, setStateError] = useState(null)
  const [showCreateAccessTokenDialog, setShowCreateAccessTokenDialog] =
    useState(false)
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_ACCESS_TOKEN_LIST
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Access Tokens")
  if (done) {
    return result
  }
  return (
    <>
      <Fieldset
        id="accessTokens"
        title="Access Tokens"
        action={
          <Button
            variant="primary"
            onClick={() => setShowCreateAccessTokenDialog(true)}
          >
            New access token
          </Button>
        }
      >
        <Messages success={stateSuccess} error={stateError} />
        <AccessTokensTable
          accessTokens={data?.accessTokenList}
          onDelete={deleteAccessToken}
          onUpdate={updateAccessToken}
        />
      </Fieldset>

      <AccessTokenModal
        isNew
        title="Create new access token"
        show={showCreateAccessTokenDialog}
        setShow={setShowCreateAccessTokenDialog}
        onConfirm={values => {
          setShowCreateAccessTokenDialog(false)
          createAccessToken(values)
        }}
      />
    </>
  )

  function setSuccess(msg) {
    setStateSuccess(msg)
    setStateError(null)
  }

  function setError(msg) {
    setStateError(msg)
    setStateSuccess(null)
  }

  function createAccessToken(accessToken) {
    async function getSha256Digest(string) {
      return await crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(string))
        .then(digest => new Uint8Array(digest))
    }

    getSha256Digest(accessToken.tokenValue)
      .then(digest => {
        delete accessToken.tokenValue
        accessToken.tokenHash = b64(digest)
        return API.mutation(GQL_CREATE_ACCESS_TOKEN, { accessToken })
          .then(() => {
            setSuccess("Access token successfully created")
            refetch()
          })
          .catch(error => {
            setError(error)
            jumpToTop()
          })
      })
      .catch(error => {
        setError(`Can't generate new access token: ${error}`)
      })
  }

  function deleteAccessToken(accessToken) {
    return API.mutation(GQL_DELETE_ACCESS_TOKEN, { accessToken })
      .then(() => {
        setSuccess("Access token successfully deleted")
        refetch()
      })
      .catch(error => {
        setError(error)
        jumpToTop()
      })
  }

  function updateAccessToken(accessToken) {
    return API.mutation(GQL_UPDATE_ACCESS_TOKEN, { accessToken })
      .then(() => {
        setSuccess("Access token successfully updated")
        refetch()
      })
      .catch(error => {
        setError(error)
        jumpToTop()
      })
  }
}

export default connect(null, mapPageDispatchersToProps)(AccessTokensList)
