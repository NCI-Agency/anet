import MultiTypeAdvancedSelectComponent from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import * as FieldHelper from "components/FieldHelper"
import { FastField, Form, Formik } from "formik"
import PropTypes from "prop-types"
import React, { useCallback } from "react"
import { Button, Form as FormBS, Modal } from "react-bootstrap"
import { Transforms } from "slate"
import { ReactEditor } from "slate-react"
import { ANET_LINK, EXTERNAL_LINK, getEntityInfoFromUrl } from "utils_links"
import * as yup from "yup"

const LinkSourceAnet = ({
  editor,
  showModal,
  setShowModal,
  selection,
  external
}) => {
  const insertAnetLink = useCallback(
    node => {
      ReactEditor.focus(editor)
      if (selection) {
        Transforms.insertNodes(editor, node, {
          at: { path: selection.focus.path, offset: selection.focus.offset },
          select: true
        })
      } else {
        Transforms.insertNodes(editor, node, {
          select: true
        })
      }
      Transforms.move(editor, { distance: 1 })
      setShowModal(false)
    },
    [editor, selection, setShowModal]
  )

  return (
    <Modal
      centered
      show={showModal}
      aria-labelledby="Link chooser"
      className="editor-link-chooser"
      onHide={() => setShowModal(false)}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {external ? "Link to external" : "Link to ANET entity"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {external ? (
          <ExternalLinkForm
            onConfirm={(values, form) => {
              const externalLinkNode = createExternalLinkNode(
                values.url,
                values.text
              )
              insertAnetLink(externalLinkNode)
            }}
            onCancel={() => setShowModal(false)}
          />
        ) : (
          <MultiTypeAdvancedSelectComponent
            onConfirm={(value, objectType) => {
              const anetLinkNode = createAnetLinkNode(objectType, value.uuid)
              insertAnetLink(anetLinkNode)
            }}
          />
        )}
      </Modal.Body>
    </Modal>
  )
}

LinkSourceAnet.propTypes = {
  editor: PropTypes.object.isRequired,
  showModal: PropTypes.bool,
  setShowModal: PropTypes.func.isRequired,
  selection: PropTypes.object,
  external: PropTypes.bool
}

LinkSourceAnet.defaultProps = {
  external: false
}

const ExternalLinkForm = ({ onConfirm, onCancel }) => {
  const yupSchema = yup.object().shape({
    url: yup.string().required("Url is required").default(""),
    text: yup.string().required("Text is required").default("")
  })
  return (
    <Formik
      validateOnMount
      validationSchema={yupSchema}
      initialValues={{ url: "", text: "" }}
      onSubmit={onConfirm}
    >
      {({ submitForm, isSubmitting, isValid }) => {
        return (
          <Form>
            <FastField name="url" component={FieldHelper.InputField}>
              <FormBS.Text as="div">
                Specify a valid URL like: https://www.example.com/path
              </FormBS.Text>
            </FastField>
            <FastField name="text" component={FieldHelper.InputField} />
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
                  disabled={isSubmitting || !isValid}
                >
                  Add link
                </Button>
              </div>
            </div>
          </Form>
        )
      }}
    </Formik>
  )
}

ExternalLinkForm.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}

function createAnetLinkNode(entityType, entityUuid) {
  return {
    type: ANET_LINK,
    entityType,
    entityUuid,
    children: [{ text: "" }]
  }
}

function createExternalLinkNode(url, text) {
  const entityInfo = getEntityInfoFromUrl(url)
  if (entityInfo.type === ANET_LINK) {
    return createAnetLinkNode(entityInfo.entityType, entityInfo.entityUuid)
  }
  return {
    type: EXTERNAL_LINK,
    url,
    children: [{ text }]
  }
}

export default LinkSourceAnet
