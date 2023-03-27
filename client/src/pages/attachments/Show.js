import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
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
import React, { useContext } from "react"
import { Col } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"

const GQL_GET_ATTACHMENT = gql`
  query ($uuid: String) {
    attachment(uuid: $uuid) {
      uuid
      fileName
      mimeType
      classification
      description
    }
  }
`

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
  usePageTitle(data?.attachment?.name)
  if (done) {
    return result
  }

  const attachment = new Attachment(data ? data.attachment : {})
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const stateError = routerLocation.state && routerLocation.state.error
  const canEdit = currentUser.isSuperuser()

  return (
    <Formik enableReinitialize initialValues={attachment}>
      {({ values }) => {
        const action = canEdit && (
          <LinkTo
            modelType="Attachment"
            model={attachment}
            edit
            button="primary"
          >
            Edit
          </LinkTo>
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
                    xs={12}
                    sm={3}
                    lg={4}
                    className="label-align"
                    style={{
                      padding: "10px",
                      background: "#c1c1c1",
                      borderRadius: "6px"
                    }}
                  >
                    image area
                  </Col>
                  <Col xs={12} sm={3} lg={8}>
                    <Field
                      name="fileName"
                      component={FieldHelper.ReadonlyField}
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
