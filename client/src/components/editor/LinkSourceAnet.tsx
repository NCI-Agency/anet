import MultiTypeAdvancedSelectComponent, {
  ALL_ENTITY_TYPES
} from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import * as FieldHelper from "components/FieldHelper"
import { FastField, Form, Formik } from "formik"
import React, { useCallback } from "react"
import { Button, Form as FormBS, Modal } from "react-bootstrap"
import { getSelectedParentNode } from "richTextUtils"
import { Transforms } from "slate"
import { ReactEditor } from "slate-react"
import { ANET_LINK, EXTERNAL_LINK, getEntityInfoFromUrl } from "utils_links"
import * as yup from "yup"

interface LinkSourceAnetProps {
  editor: any
  showModal?: boolean
  setShowModal: (...args: unknown[]) => unknown
  external?: boolean
}

const LinkSourceAnet = ({
  editor,
  showModal,
  setShowModal,
  external
}: LinkSourceAnetProps) => {
  const insertAnetLink = useCallback(
    node => {
      ReactEditor.focus(editor)
      if (editor.selection) {
        const { replaceSelection, selectedParentNode } = getParentNodeProps(
          editor,
          external
        )
        if (replaceSelection) {
          Transforms.removeNodes(editor, { at: selectedParentNode?.[1] })
        }
        Transforms.insertNodes(editor, node, {
          at: editor.selection.focus,
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
    [editor, external, setShowModal]
  )

  const value = getParentNodeProps(editor, external)?.value

  return (
    <Modal
      centered
      size="lg"
      show={showModal}
      aria-labelledby="Link chooser"
      backdrop
      backdropClassName="editor-link-chooser"
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
            url={value?.url}
            text={value?.text}
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
            objectType={value?.objectType}
            entityTypes={ALL_ENTITY_TYPES}
            value={value?.object}
            valueKey="uuid"
            onConfirm={(value, objectType) => {
              if (value?.uuid) {
                const anetLinkNode = createAnetLinkNode(objectType, value.uuid)
                insertAnetLink(anetLinkNode)
              }
            }}
          />
        )}
      </Modal.Body>
    </Modal>
  )
}

LinkSourceAnet.defaultProps = {
  external: false
}

interface ExternalLinkFormProps {
  url?: string
  text?: string
  onConfirm: (...args: unknown[]) => unknown
  onCancel: (...args: unknown[]) => unknown
}

const ExternalLinkForm = ({
  url,
  text,
  onConfirm,
  onCancel
}: ExternalLinkFormProps) => {
  const yupSchema = yup.object().shape({
    url: yup.string().required("Url is required").default(""),
    text: yup.string().required("Text is required").default("")
  })
  return (
    <Formik
      validateOnMount
      validationSchema={yupSchema}
      initialValues={{ url, text }}
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

ExternalLinkForm.defaultProps = {
  url: "",
  text: ""
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

function getParentNodeProps(editor, external) {
  const selectedParentNode = getSelectedParentNode(editor)
  const selectedParent = selectedParentNode?.[0]
  let value
  if (external && selectedParent?.type === EXTERNAL_LINK) {
    value = {
      url: selectedParent.url,
      text: selectedParent.children?.[0]?.text
    }
  } else if (!external && selectedParent?.type === ANET_LINK) {
    value = {
      objectType: selectedParent.entityType,
      object: selectedParent.entityUuid
        ? { uuid: selectedParent.entityUuid }
        : null
    }
  } else {
    value = null
  }
  return { replaceSelection: !!value, selectedParentNode, value }
}

export default LinkSourceAnet
