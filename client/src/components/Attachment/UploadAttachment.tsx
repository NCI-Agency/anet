import { gql } from "@apollo/client"
import { Icon, Tooltip } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import axios from "axios"
import {
  gqlAllAttachmentFields,
  gqlAttachmentRelatedObjectsFields
} from "constants/GraphQLDefinitions"
import MultiTypeAdvancedSelectComponent, {
  ENTITY_TYPES
} from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import Messages from "components/Messages"
import { Attachment } from "models"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { toast } from "react-toastify"
import Settings from "settings"
import utils from "utils"
import { RELATED_OBJECT_TYPE_TO_ENTITY_TYPE } from "utils_links"
import "./Attachment.css"
import AttachmentCard from "./AttachmentCard"

const GQL_CREATE_ATTACHMENT = gql`
  mutation ($attachment: AttachmentInput!) {
    createAttachment(attachment: $attachment)
  }
`

const GQL_GET_ATTACHMENT_FOR_LINKING = gql`
  query ($uuid: String!) {
    attachment(uuid: $uuid) {
      ${gqlAllAttachmentFields}
      ${gqlAttachmentRelatedObjectsFields}
    }
  }
`

const GQL_UPDATE_ATTACHMENT = gql`
  mutation ($attachment: AttachmentInput!, $force: Boolean) {
    updateAttachment(attachment: $attachment, force: $force)
  }
`

export const attachmentSave = async (
  fileName,
  mimeType,
  contentLength,
  caption,
  file,
  relatedObjectType,
  relatedObjectUuid
) => {
  const attachment = Attachment.filterClientSideFields(
    new Attachment({
      fileName,
      mimeType,
      caption,
      contentLength,
      attachmentRelatedObjects: [
        {
          relatedObjectType,
          relatedObjectUuid
        }
      ]
    })
  )
  return API.mutation(GQL_CREATE_ATTACHMENT, { attachment })
    .then(response => {
      attachment.uuid = response.createAttachment
      const [authHeaderName, authHeaderValue] = API._getAuthHeader()
      const toastId = `uploadProgress.${attachment.uuid}`
      toast.info(`Upload of ${attachment.fileName} in progress`, {
        toastId,
        autoClose: false,
        closeOnClick: false,
        pauseOnHover: false
      })
      return axios
        .postForm(
          `/api/attachment/uploadAttachmentContent/${attachment.uuid}`,
          { file },
          {
            headers: { [authHeaderName]: authHeaderValue },
            onUploadProgress: progressEvent => {
              if (progressEvent.progress === 1) {
                toast.update(toastId, {
                  render: `Processing uploaded attachment ${attachment.fileName}`
                })
              } else {
                toast.update(toastId, {
                  progress: progressEvent.progress
                })
              }
            }
          }
        )
        .then(() => {
          toast.done(toastId)
          toast.success(
            `Your attachment ${attachment.fileName} has been uploaded`
          )
          return attachment
        })
        .catch(error => {
          toast.dismiss(toastId)
          attachment.contentLength = -1
          toast.error(
            `Attachment content upload failed for ${attachment.fileName}: ${
              error.response?.data?.error || error.message
            }`
          )
          return attachment
        })
    })
    .catch(error => {
      toast.error(
        `Attachment upload for ${attachment.fileName} failed: ${error.message}`
      )
      return undefined
    })
}

interface UploadAttachmentProps {
  attachments?: any[]
  updateAttachments?: (...args: unknown[]) => unknown
  relatedObjectType: string
  relatedObjectUuid?: string
  saveRelatedObject?: (...args: unknown[]) => unknown
}

const UploadAttachment = ({
  attachments = [],
  updateAttachments = () => {},
  relatedObjectType,
  relatedObjectUuid,
  saveRelatedObject
}: UploadAttachmentProps) => {
  const [error, setError] = useState(null)
  const [objectUuid, setObjectUuid] = useState(relatedObjectUuid)
  const [linkSelection, setLinkSelection] = useState<any[]>([])
  const [isLinking, setIsLinking] = useState(false)
  const mimeTypes = Settings.fields.attachment.fileTypes?.map(
    fileType => fileType.mimeType
  )
  const selectedNames = linkSelection.map(
    attachment => attachment.caption || attachment.fileName || attachment.uuid
  )
  const maxSelectedNames = 5
  const selectedSummary =
    selectedNames.length > maxSelectedNames
      ? selectedNames.slice(0, maxSelectedNames).join(", ") +
        " +" +
        (selectedNames.length - maxSelectedNames) +
        " more"
      : selectedNames.join(", ")

  const handleFileEvent = async e => {
    // Must keep a copy of this state here, as it is not updated while this function runs
    let currentAttachments = [...attachments]
    let currentObjectUuid = objectUuid
    for (const file of e.target?.files || []) {
      if (!file) {
        // No file was selected, just continue
        continue
      }
      if (!mimeTypes?.includes(file.type)) {
        toast.error(
          `Attaching "${file.name}" failed; files of type "${file.type}" are not allowed`
        )
        continue
      }
      const caption = utils.stripExtension(file.name)
      if (currentObjectUuid) {
        const newAttachment = await attachmentSave(
          file.name,
          file.type,
          file.size,
          caption,
          file,
          relatedObjectType,
          currentObjectUuid
        )
        if (newAttachment) {
          currentAttachments = [...currentAttachments, newAttachment]
          updateAttachments(currentAttachments)
        }
      } else {
        // Save the related object first
        await saveRelatedObject()
          .then(async response => {
            currentObjectUuid = response.uuid
            setObjectUuid(currentObjectUuid)
            const newAttachment = await attachmentSave(
              file.name,
              file.type,
              file.size,
              caption,
              file,
              relatedObjectType,
              currentObjectUuid
            )
            if (newAttachment) {
              currentAttachments = [...currentAttachments, newAttachment]
              updateAttachments(currentAttachments)
            }
          })
          .catch(() =>
            toast.error(
              `Attaching "${file.name}" failed; there was an error saving the ${RELATED_OBJECT_TYPE_TO_ENTITY_TYPE[relatedObjectType]}`
            )
          )
      }
    }
  }

  const handleLinkAttachments = async () => {
    setIsLinking(true)
    let currentObjectUuid = objectUuid
    try {
      if (!currentObjectUuid) {
        const response = await saveRelatedObject()
        currentObjectUuid = response.uuid
        setObjectUuid(currentObjectUuid)
      }

      const existingAttachmentUuids = new Set(
        attachments.map(attachment => attachment.uuid)
      )
      const toLink = linkSelection.filter(
        attachment => !existingAttachmentUuids.has(attachment.uuid)
      )


      const results = await Promise.all(
        toLink.map(async selected => {
          try {
            const data = await API.query(GQL_GET_ATTACHMENT_FOR_LINKING, {
              uuid: selected.uuid
            })
            const attachment = data?.attachment
            if (!attachment) {
              return { error: true, attachment: selected }
            }
            const relatedObjects = attachment.attachmentRelatedObjects || []
            const alreadyLinked = relatedObjects.some(
              object =>
                object.relatedObjectType === relatedObjectType &&
                object.relatedObjectUuid === currentObjectUuid
            )
            if (alreadyLinked) {
              return { skipped: true, attachment }
            }

            const nextRelatedObjects = [
              ...relatedObjects.map(
                ({ relatedObjectType, relatedObjectUuid }) => ({
                  relatedObjectType,
                  relatedObjectUuid
                })
              ),
              {
                relatedObjectType,
                relatedObjectUuid: currentObjectUuid
              }
            ]

            const attachmentInput = Attachment.filterClientSideFields(attachment)
            attachmentInput.attachmentRelatedObjects = nextRelatedObjects

            await API.mutation(GQL_UPDATE_ATTACHMENT, {
              attachment: attachmentInput
            })

            return { linked: true, attachment }
          } catch (linkError) {
            return { error: true, attachment: selected, linkError }
          }
        })
      )

      const newlyLinked = results
        .filter(r => r?.linked)
        .map(r => r.attachment)

      if (newlyLinked.length > 0) {
        const merged = [...attachments]
        newlyLinked.forEach(att => {
          if (!merged.some(existing => existing.uuid === att.uuid)) {
            merged.push(att)
          }
        })
        updateAttachments(merged)
        toast.success(`${newlyLinked.length} attachment(s) linked successfully`)
      }


      setLinkSelection([])
    } catch (linkError) {
      setError(linkError)
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <div>
      <Messages error={error} />
      {/** **** Select and drop file in here **** **/}
      <section className="file-upload-container">
        <div>
          <p className="drag-drop-text">
            <Icon className="icon" size={30} icon={IconNames.EXPORT} />
            <span style={{ marginTop: "5px" }}>
              <b>Choose a file</b> or Drag it here
            </span>
          </p>
        </div>
        <input
          className="form-field"
          id="fileUpload"
          type="file"
          multiple
          accept={mimeTypes}
          onChange={handleFileEvent}
        />
      </section>

      <section className="attachment-link-container">
        <div className="attachment-link-header">
          <Icon className="icon" size={20} icon={IconNames.LINK} />
          <span>Link existing attachments</span>
        </div>
        <MultiTypeAdvancedSelectComponent
          fieldName="linkExistingAttachments"
          entityTypes={[ENTITY_TYPES.ATTACHMENTS]}
          objectType={ENTITY_TYPES.ATTACHMENTS}
          isMultiSelect
          value={linkSelection}
          onConfirm={value => setLinkSelection(value)}
          className="attachment-link-select"
        />
        <div className="attachment-link-actions">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleLinkAttachments}
            disabled={isLinking || linkSelection.length === 0}
          >
            {isLinking ? "Linking..." : "Link selected"}
          </Button>
          {linkSelection.length > 0 && (
            <Tooltip content={selectedSummary} position="top">
              <span className="attachment-link-count">
                Will link: {linkSelection.length} attachment(s)
              </span>
            </Tooltip>
          )}
        </div>
      </section>

      {/** **** Show uploaded files in here **** **/}
      <div className="attachment-card-list">
        {attachments.map(attachment => (
          <AttachmentCard
            key={attachment.uuid}
            attachment={attachment}
            edit
            setError={setError}
            uploadedList={attachments}
            setUploadedList={updateAttachments}
          />
        ))}
      </div>
    </div>
  )
}

export default UploadAttachment
