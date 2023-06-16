import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import classNames from "classnames"
import AppContext from "components/AppContext"
import "components/Attachment/Attachment.css"
import AttachmentRelatedObjectsTable from "components/Attachment/AttachmentRelatedObjectsTable"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Button, Col } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import utils from "utils"

const GQL_GET_ATTACHMENT = gql`
  query ($uuid: String) {
    attachment(uuid: $uuid) {
      uuid
      fileName
      contentLength
      mimeType
      classification
      description
      author {
        name
        uuid
        avatar
      }
      attachmentRelatedObjects {
        relatedObject {
          ... on AuthorizationGroup {
            name
          }
          ... on Location {
            name
          }
          ... on Organization {
            shortName
          }
          ... on Person {
            name
            role
            rank
            avatar(size: 32)
          }
          ... on Position {
            type
            name
          }
          ... on Report {
            intent
          }
          ... on Task {
            shortName
          }
        }
        relatedObjectUuid
        relatedObjectType
      }
    }
  }
`

const AttachmentImage = ({
  uuid,
  backgroundSize,
  backgroundImage,
  contentMissing
}) => {
  const image = (
    <div
      className="image-preview info-show card-image attachment-image h-100"
      style={{
        backgroundSize,
        backgroundImage: `url(${backgroundImage})`
      }}
    />
  )
  return (
    <div
      className={classNames("img-preview", {
        "img-hover-zoom": !contentMissing
      })}
    >
      {contentMissing ? (
        <>{image}</>
      ) : (
        <a href={`/api/attachment/view/${uuid}`} className="d-flex h-100">
          {image}
        </a>
      )}
    </div>
  )
}
AttachmentImage.propTypes = {
  uuid: PropTypes.string.isRequired,
  backgroundSize: PropTypes.string.isRequired,
  backgroundImage: PropTypes.string.isRequired,
  contentMissing: PropTypes.bool.isRequired
}

const AttachmentShow = ({ pageDispatchers }) => {
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
    currentUser.isAdmin() || currentUser.uuid === attachment.author.uuid
  const { backgroundSize, backgroundImage, contentMissing } =
    utils.getAttachmentIconDetails(attachment)
  return (
    <Formik enableReinitialize initialValues={attachment}>
      {({ values }) => {
        const action = (
          <>
            <Button
              className="d-flex p-0 align-items-center"
              disabled={contentMissing}
            >
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
                style={{ marginLeft: "10px" }}
                button="primary"
              >
                Edit
              </LinkTo>
            )}
          </>
        )

        return (
          <div>
            <Messages success={stateSuccess} error={stateError} />
            <Form className="form-horizontal" method="post">
              <Fieldset
                title={`Attachment #${attachment.uuid}`}
                action={action}
              />
              <Fieldset>
                <div style={{ display: "flex" }}>
                  <Col
                    id="attachmentImage"
                    xs={12}
                    sm={3}
                    className="label-align"
                  >
                    <AttachmentImage
                      uuid={attachment.uuid}
                      contentMissing={contentMissing}
                      backgroundSize={backgroundSize}
                      backgroundImage={backgroundImage}
                    />
                  </Col>
                  <Col id="attachmentDetails" xs={12} sm={3} lg={8}>
                    <Field
                      name="fileName"
                      component={FieldHelper.ReadonlyField}
                    />
                    <Field
                      name="contentLength"
                      component={FieldHelper.ReadonlyField}
                      humanValue={utils.humanReadableFileSize(
                        attachment.contentLength
                      )}
                    />
                    <Field
                      name="owner"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        <LinkTo modelType="Person" model={attachment.author} />
                      }
                    />
                    <Field
                      name="description"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        <RichTextEditor readOnly value={values.description} />
                      }
                    />
                    <Field
                      name="mimeType"
                      component={FieldHelper.ReadonlyField}
                    />
                    <Field
                      name="classification"
                      component={FieldHelper.ReadonlyField}
                      humanValue={Attachment.humanNameOfStatus(
                        attachment.classification
                      ).toUpperCase()}
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

AttachmentShow.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(AttachmentShow)
