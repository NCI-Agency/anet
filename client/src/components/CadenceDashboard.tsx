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
import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"
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
  const navigate = useNavigate()
  const location = useLocation()

  const [authorizationGroupAdvisors, setAuthorizationGroupAdvisors] =
    useState<AuthorizationGroup | null>(null)
  const [authorizationGroupInterlocutors, setAuthorizationGroupInterlocutors] =
    useState<AuthorizationGroup | null>(null)

  const updateSingleQueryParam = (
    key: "advisors" | "interlocutors",
    value: string | null
  ) => {
    const params = new URLSearchParams(location.search)

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    navigate({ search: params.toString() }, { replace: true })
  }

  const handleChangeAuthorizationGroup = async (
    selected,
    setter,
    type: "advisors" | "interlocutors"
  ) => {
    if (!selected?.uuid) {
      setter(null)
      updateSingleQueryParam(type, null)
      return
    }

    try {
      const result = await API.client.query({
        query: GQL_GET_AUTHORIZATION_GROUP,
        variables: { uuid: selected.uuid },
        fetchPolicy: "network-only"
      })

      if (result?.data?.authorizationGroup) {
        setter(result.data.authorizationGroup)
        updateSingleQueryParam(type, result.data.authorizationGroup.uuid)
      }
    } catch (err) {
      console.error("Failed to fetch authorization group", err)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)

    const advisorsUuid = params.get("advisors")
    const interlocutorsUuid = params.get("interlocutors")

    if (
      advisorsUuid &&
      (!authorizationGroupAdvisors ||
        authorizationGroupAdvisors.uuid !== advisorsUuid)
    ) {
      handleChangeAuthorizationGroup(
        { uuid: advisorsUuid },
        setAuthorizationGroupAdvisors,
        "advisors"
      )
    }

    if (
      interlocutorsUuid &&
      (!authorizationGroupInterlocutors ||
        authorizationGroupInterlocutors.uuid !== interlocutorsUuid)
    ) {
      handleChangeAuthorizationGroup(
        { uuid: interlocutorsUuid },
        setAuthorizationGroupInterlocutors,
        "interlocutors"
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

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
                setAuthorizationGroupAdvisors,
                "advisors"
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
                setAuthorizationGroupInterlocutors,
                "interlocutors"
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
