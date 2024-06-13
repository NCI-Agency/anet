import { gql } from "@apollo/client"
import API from "api"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import EntityAvatarEditModal from "components/avatar/EntityAvatarEditModal"
import ConfirmDestructive from "components/ConfirmDestructive"
import _isEmpty from "lodash/isEmpty"
import EntityAvatar from "models/EntityAvatar"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { Alert } from "react-bootstrap"
import { toast } from "react-toastify"
import Settings from "settings"

const GQL_GET_ENTITY_AVATAR = gql`
  query ($entityUuid: String) {
    entityAvatar(entityUuid: $entityUuid) {
      entityUuid
      attachmentUuid
      cropLeft
      cropTop
      cropWidth
      cropHeight
    }
  }
`
const GQL_CREATE_OR_UPDATE_ENTITY_AVATAR = gql`
  mutation ($entityAvatar: EntityAvatarInput!) {
    createOrUpdateEntityAvatar(entityAvatar: $entityAvatar)
  }
`
const GQL_DELETE_ENTITY_AVATAR = gql`
  mutation ($entityUuid: String) {
    deleteEntityAvatar(entityUuid: $entityUuid)
  }
`
export const EntityAvatarComponent = ({
  entityUuid,
  entityName,
  editMode,
  imageAttachments
}) => {
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const [currentAvatar, setCurrentAvatar] = useState(null)

  // If the entityUUid changes get the entity avatar
  useEffect(() => {
    getEntityAvatar(entityUuid)
      .then(response => setCurrentAvatar(response.entityAvatar))
      .catch()
  }, [entityUuid, imageAttachments])

  // Also react to changes in image attachments as the one linked to the current avatar might have been deleted
  useEffect(() => {
    if (
      currentAvatar &&
      !imageAttachments.some(a => a.uuid === currentAvatar.attachmentUuid)
    ) {
      setCurrentAvatar(null)
    }
  }, [currentAvatar, imageAttachments])

  return (
    <>
      {currentAvatar && (
        <>
          <EntityAvatarDisplay avatar={currentAvatar} />
        </>
      )}
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
                  objectDisplay={`for ${entityName}`}
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
                images={imageAttachments}
                onAvatarUpdate={onAvatarUpdate}
              />
            </div>
          )}
        </>
      )}
    </>
  )

  function getEntityAvatar(entityId) {
    return API.query(GQL_GET_ENTITY_AVATAR, {
      entityUuid: entityId
    })
  }

  async function onAvatarUpdate(attachmentUuid, coordinates) {
    // Build entity avatar object
    const entityAvatar = new EntityAvatar()
    entityAvatar.entityUuid = entityUuid
    entityAvatar.attachmentUuid = attachmentUuid
    entityAvatar.cropLeft = coordinates.left
    entityAvatar.cropTop = coordinates.top
    entityAvatar.cropWidth = coordinates.width
    entityAvatar.cropHeight = coordinates.height

    await API.mutation(GQL_CREATE_OR_UPDATE_ENTITY_AVATAR, {
      entityAvatar
    })
      .then(() => {
        toast.success(`Avatar for organization ${entityName} updated.`)
        setCurrentAvatar(entityAvatar)
      })
      .catch(error =>
        toast.error(
          `Failed to update avatar for organization ${entityName}: ${error.message}`
        )
      )
  }

  async function clearAvatar() {
    await API.mutation(GQL_DELETE_ENTITY_AVATAR, {
      entityUuid
    })
      .then(() => {
        toast.success(`Avatar for organization ${entityName} cleared.`)
        setCurrentAvatar(null)
      })
      .catch(error =>
        toast.error(
          `Failed to clear avatar for organization ${entityName}: ${error.message}`
        )
      )
  }
}

EntityAvatarComponent.propTypes = {
  entityUuid: PropTypes.string.isRequired,
  entityName: PropTypes.string.isRequired,
  editMode: PropTypes.bool.isRequired,
  imageAttachments: PropTypes.array
}

export default EntityAvatarComponent
