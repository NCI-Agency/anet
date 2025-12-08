import {
  gqlAllAuthorizationGroupFields,
  gqlAuthorizationGroupMembersWithEmailFields,
  gqlEntityFieldsMap
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import { AuthorizationGroupOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import EngagementsBetweenCommunitiesMatrix from "components/EngagementsBetweenCommunitiesMatrix"
import { mapPageDispatchersToProps } from "components/Page"
import { AuthorizationGroup } from "models"
import React, { useState } from "react"
import { connect } from "react-redux"
import COMMUNITIES_ICON from "resources/communities.png"
import Settings from "settings"

const GQL_GET_AUTHORIZATION_GROUP = gql`
  query ($uuid: String) {
    authorizationGroup(uuid: $uuid) {
      ${gqlAllAuthorizationGroupFields}
      administrativePositions {
        ${gqlEntityFieldsMap.Position}
        location {
          ${gqlEntityFieldsMap.Location}
        }
        organization {
          ${gqlEntityFieldsMap.Organization}
        }
        person {
          ${gqlEntityFieldsMap.Person}
        }
      }
      ${gqlAuthorizationGroupMembersWithEmailFields}
    }
  }
`

const CadenceDashboard = () => {
  const [authorizationGroupAdvisors, setAuthorizationGroupAdvisors] =
    useState(undefined)
  const [authorizationGroupInterlocutors, setAuthorizationGroupInterlocutors] =
    useState(undefined)

  const handleChangeAuthorizationGroup = async (selected, setter) => {
    if (!selected?.uuid) {
      setter(null)
      return
    }

    const uuid = selected.uuid

    try {
      const result = await API.client.query({
        query: GQL_GET_AUTHORIZATION_GROUP,
        variables: { uuid },
        fetchPolicy: "network-only"
      })

      if (result?.data?.authorizationGroup) {
        setter(result.data.authorizationGroup)
      }
    } catch (err) {
      console.error("Failed to fetch authorization group", err)
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: "24px" }}>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="authorizationGroupAdvisors"
            style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}
          >
            Select the community with advisors
          </label>
          <AdvancedSingleSelect
            fieldName="authorizationGroupAdvisors"
            placeholder={Settings.fields.authorizationGroup.placeholder}
            value={authorizationGroupAdvisors}
            overlayColumns={["Name"]}
            overlayRenderRow={AuthorizationGroupOverlayRow}
            objectType={AuthorizationGroup}
            fields={AuthorizationGroup.autocompleteQuery}
            valueKey="name"
            addon={COMMUNITIES_ICON}
            onChange={selected =>
              handleChangeAuthorizationGroup(
                selected,
                setAuthorizationGroupAdvisors
              )
            }
          />
        </div>

        <div style={{ flex: 1 }}>
          <label
            htmlFor="authorizationGroupInterlocutors"
            style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}
          >
            Select the community with interlocutors
          </label>
          <AdvancedSingleSelect
            fieldName="authorizationGroupInterlocutors"
            placeholder={Settings.fields.authorizationGroup.placeholder}
            value={authorizationGroupInterlocutors}
            overlayColumns={["Name"]}
            overlayRenderRow={AuthorizationGroupOverlayRow}
            objectType={AuthorizationGroup}
            fields={AuthorizationGroup.autocompleteQuery}
            valueKey="name"
            addon={COMMUNITIES_ICON}
            onChange={selected =>
              handleChangeAuthorizationGroup(
                selected,
                setAuthorizationGroupInterlocutors
              )
            }
          />
        </div>
      </div>

      {authorizationGroupAdvisors && authorizationGroupInterlocutors && (
        <EngagementsBetweenCommunitiesMatrix
          authorizationGroupAdvisors={authorizationGroupAdvisors}
          authorizationGroupInterlocutors={authorizationGroupInterlocutors}
        />
      )}
    </>
  )
}
export default connect(null, mapPageDispatchersToProps)(CadenceDashboard)
