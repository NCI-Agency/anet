import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import "components/Attachment/Attachment.css"
import AttachmentImage from "components/Attachment/AttachmentImage"
import AttachmentRelatedObjectsTable from "components/Attachment/AttachmentRelatedObjectsTable"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import FindObjectsButton from "components/FindObjectsButton"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import { Attachment } from "models"
import React, { useContext } from "react"
import { Button, Col } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"

const GQL_GET_ATTACHMENT = gql`
  query ($uuid: String) {
    attachment(uuid: $uuid) {
      ${Attachment.basicFieldsQuery}
      author {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      attachmentRelatedObjects {
        relatedObject {
          ... on AuthorizationGroup {
            name
          }
          ... on Event {
            name
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          ... on EventSeries {
            name
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          ... on Location {
            name
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          ... on Organization {
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          ... on Person {
            name
            rank
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          ... on Position {
            type
            name
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          ... on Report {
            intent
          }
          ... on Task {
            shortName
            longName
          }
        }
        relatedObjectUuid
        relatedObjectType
      }
    }
  }
`

interface AttachmentShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const AttachmentShow = ({ pageDispatchers }: AttachmentShowProps) => {
  const { currentUser } = useContext(AppContext)
  const { uuid } = useParams()
  const routerLocation = useLocation()
  const { loading, error, data } = API.useApiQuery(GQL_GET_ATTACHMENT, { uuid })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Attachment",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.attachment?.fileName || data?.attachment?.uuid)
  if (done) {
    return result
  }

  const attachment = new Attachment(data ? data.attachment : {})

  const stateSuccess = routerLocation.state && routerLocation.state.success
  const stateError = routerLocation.state && routerLocation.state.error
  const canEdit =
    currentUser.isAdmin() ||
    (!Settings.fields.attachment.restrictToAdmins &&
      currentUser.uuid === attachment.author.uuid)
  const { iconSize, iconImage, contentMissing } =
    utils.getAttachmentIconDetails(attachment)
  return (
    <Formik enableReinitialize initialValues={attachment}>
      {({ values }) => {
        const searchText = [attachment.caption, attachment.fileName].join(" ")
        const action = (
          <>
            <Button variant="primary" disabled={contentMissing}>
              <a
                href={`/api/attachment/download/${attachment.uuid}`}
                style={{
                  color: "white",
                  padding: "6px 12px",
                  textDecoration: "none"
                }}
              >
                {contentMissing ? "Attachment has no content" : "Download"}
              </a>
            </Button>
            {canEdit && (
              <LinkTo
                modelType="Attachment"
                model={attachment}
                edit
                button="primary"
              >
                Edit
              </LinkTo>
            )}
            <FindObjectsButton
              objectLabel="Attachment"
              searchText={searchText}
            />
          </>
        )
        return (
          <div>
            <Messages success={stateSuccess} error={stateError} />
            <Form className="form-horizontal" method="post">
              <Fieldset
                title={`Attachment ${attachment.caption}`}
                action={action}
              />
              <Fieldset>
                <div className="attachment-show" style={{ display: "flex" }}>
                  <Col xs={12} sm={3} className="attachment-column label-align">
                    <AttachmentImage
                      uuid={attachment.uuid}
                      caption={attachment.caption}
                      contentMissing={contentMissing}
                      iconSize={iconSize}
                      iconImage={iconImage}
                    />
                  </Col>
                  <Col className="attachment-details" xs={12} sm={3} lg={8}>
                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.attachment.fileName}
                      name="fileName"
                      component={FieldHelper.ReadonlyField}
                    />
                    <Field
                      name="owner"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        <LinkTo modelType="Person" model={attachment.author} />
                      }
                    />
                    <Field
                      name="mimeType"
                      component={FieldHelper.ReadonlyField}
                    />
                    <Field
                      name="contentLength"
                      component={FieldHelper.ReadonlyField}
                      humanValue={utils.humanReadableFileSize(
                        attachment.contentLength
                      )}
                    />
                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.confidentialityLabel}
                      name="classification"
                      component={FieldHelper.ReadonlyField}
                      humanValue={utils.getConfidentialityLabelForChoice(
                        attachment.classification
                      )}
                    />
                    <Field
                      name="used in"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        <AttachmentRelatedObjectsTable
                          relatedObjects={values.attachmentRelatedObjects}
                        />
                      }
                    />
                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.attachment.description}
                      name="description"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        <RichTextEditor readOnly value={values.description} />
                      }
                    />
                  </Col>
                </div>
              </Fieldset>
            </Form>
          </div>
        )
      }}
    </Formik>
  )
}

export default connect(null, mapPageDispatchersToProps)(AttachmentShow)
