import { gql } from "@apollo/client"
import API from "api"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import EntityAvatarEditModal from "components/avatar/EntityAvatarEditModal"
import ConfirmDestructive from "components/ConfirmDestructive"
import _isEmpty from "lodash/isEmpty"
import { EntityAvatar } from "models"
import React, { useEffect, useState } from "react"
import { Alert } from "react-bootstrap"
import { toast } from "react-toastify"
import Settings from "settings"
import { AVATAR_SETTINGS } from "./EntityAvatarDisplay"

const GQL_CREATE_OR_UPDATE_ENTITY_AVATAR = gql`
  mutation ($entityAvatar: EntityAvatarInput!) {
    createOrUpdateEntityAvatar(entityAvatar: $entityAvatar)
  }
`
const GQL_DELETE_ENTITY_AVATAR = gql`
  mutation ($relatedObjectType: String, $relatedObjectUuid: String) {
    deleteEntityAvatar(
      relatedObjectType: $relatedObjectType
      relatedObjectUuid: $relatedObjectUuid
    )
  }
`

interface EntityAvatarComponentProps {
  initialAvatar?: any
  relatedObjectType: string
  relatedObjectUuid: string
  relatedObjectName: string
  editMode?: boolean
  height?: number
  width?: number
  style?: any
  imageAttachments?: any[]
}

export const EntityAvatarComponent = ({
  initialAvatar,
  relatedObjectType,
  relatedObjectUuid,
  relatedObjectName,
  editMode,
  width,
  height,
  style,
  imageAttachments
}: EntityAvatarComponentProps) => {
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const [currentAvatar, setCurrentAvatar] = useState(null)
  useEffect(() => {
    setCurrentAvatar(initialAvatar)
  }, [initialAvatar])

  // Also react to changes in image attachments as the one linked to the current avatar might have been deleted
  useEffect(() => {
    if (
      currentAvatar &&
      imageAttachments &&
      !imageAttachments.some(a => a.uuid === currentAvatar.attachmentUuid)
    ) {
      setCurrentAvatar(null)
    }
  }, [currentAvatar, imageAttachments])

  return (
    <>
      <EntityAvatarDisplay
        avatar={currentAvatar}
        defaultAvatar={relatedObjectType}
        width={width}
        height={height}
        style={style}
      />
      {attachmentsEnabled && editMode && (
        <>
          {(_isEmpty(imageAttachments) && (
            <span>
              <Alert variant="info" style={{ textAlign: "left" }}>
                Upload some image attachments first before setting an avatar
              </Alert>
            </span>
          )) || (
            <div className="d-flex justify-content-around mt-3">
              {currentAvatar && (
                <ConfirmDestructive
                  onConfirm={clearAvatar}
                  operation="clear"
                  objectType="the avatar"
                  objectDisplay={`for ${relatedObjectName}`}
                  title="Clear avatar"
                  variant="outline-danger"
                  buttonSize="xs"
                >
                  Clear avatar
                </ConfirmDestructive>
              )}
              <EntityAvatarEditModal
                title={currentAvatar ? "Set a new avatar" : "Set an avatar"}
                avatar={currentAvatar}
                stencil={AVATAR_SETTINGS[relatedObjectType]?.stencil}
                images={imageAttachments}
                onAvatarUpdate={onAvatarUpdate}
              />
            </div>
          )}
        </>
      )}
    </>
  )

  async function onAvatarUpdate(attachmentUuid, coordinates) {
    // Build entity avatar object
    const entityAvatar = new EntityAvatar()
    entityAvatar.relatedObjectType = relatedObjectType
    entityAvatar.relatedObjectUuid = relatedObjectUuid
    entityAvatar.attachmentUuid = attachmentUuid
    if (coordinates) {
      entityAvatar.applyCrop = true
      entityAvatar.cropLeft = coordinates.left
      entityAvatar.cropTop = coordinates.top
      entityAvatar.cropWidth = coordinates.width
      entityAvatar.cropHeight = coordinates.height
    } else {
      entityAvatar.applyCrop = false
    }

    await API.mutation(GQL_CREATE_OR_UPDATE_ENTITY_AVATAR, {
      entityAvatar
    })
      .then(() => {
        toast.success(`Avatar for entity ${relatedObjectName} updated.`)
        setCurrentAvatar(entityAvatar)
      })
      .catch(error =>
        toast.error(
          `Failed to update avatar for entity ${relatedObjectName}: ${error.message}`
        )
      )
  }

  async function clearAvatar() {
    await API.mutation(GQL_DELETE_ENTITY_AVATAR, {
      relatedObjectType,
      relatedObjectUuid
    })
      .then(() => {
        toast.success(`Avatar for entity ${relatedObjectName} cleared.`)
        setCurrentAvatar(null)
      })
      .catch(error =>
        toast.error(
          `Failed to clear avatar for entity ${relatedObjectName}: ${error.message}`
        )
      )
  }
}

export default EntityAvatarComponent
