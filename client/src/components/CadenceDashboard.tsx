import {
  gqlAllAuthorizationGroupFields,
  gqlAuthorizationGroupMembersFields,
  gqlEntityFieldsMap
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import { AuthorizationGroupOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import EngagementsBetweenCommunitiesMatrix from "components/EngagementsBetweenCommunitiesMatrix"
import Messages from "components/Messages"
import { AuthorizationGroup } from "models"
import React, { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
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
      ${gqlAuthorizationGroupMembersFields}
    }
  }
`

enum QueryKey {
  ADVISORS = "advisors",
  INTERLOCUTORS = "interlocutors"
}

const CadenceDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [authorizationGroupAdvisors, setAuthorizationGroupAdvisors] =
    useState<AuthorizationGroup | null>(null)
  const [authorizationGroupInterlocutors, setAuthorizationGroupInterlocutors] =
    useState<AuthorizationGroup | null>(null)
  const [fetchError, setFetchError] = useState(null)

  const updateSingleQueryParam = (key: QueryKey, value?: string) => {
    if (value) {
      searchParams.set(key, value)
    } else {
      searchParams.delete(key)
    }
    setSearchParams(searchParams, { replace: true })
  }

  const handleChangeAuthorizationGroup = async (
    selected,
    setter,
    type: QueryKey
  ) => {
    setFetchError(null)
    if (!selected?.uuid) {
      setter(null)
      updateSingleQueryParam(type)
      return
    }

    try {
      const result = await API.query(GQL_GET_AUTHORIZATION_GROUP, {
        uuid: selected.uuid
      })
      if (result?.authorizationGroup) {
        setter(result.authorizationGroup)
        updateSingleQueryParam(type, result.authorizationGroup.uuid)
      }
    } catch (err) {
      setFetchError(err)
    }
  }

  useEffect(() => {
    const advisorsUuid = searchParams.get(QueryKey.ADVISORS)
    const interlocutorsUuid = searchParams.get(QueryKey.INTERLOCUTORS)

    if (
      advisorsUuid &&
      (!authorizationGroupAdvisors ||
        authorizationGroupAdvisors.uuid !== advisorsUuid)
    ) {
      handleChangeAuthorizationGroup(
        { uuid: advisorsUuid },
        setAuthorizationGroupAdvisors,
        QueryKey.ADVISORS
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
        QueryKey.INTERLOCUTORS
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <>
      <Messages error={fetchError} />
      <div className="d-flex" style={{ gap: "24px" }}>
        <div className="flex-fill">
          <label htmlFor="authorizationGroupAdvisors" className="form-label">
            {`Select the community with ${QueryKey.ADVISORS}`}
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
                QueryKey.ADVISORS
              )
            }
          />
        </div>

        <div className="flex-fill">
          <label
            htmlFor="authorizationGroupInterlocutors"
            className="form-label"
          >
            {`Select the community with ${QueryKey.INTERLOCUTORS}`}
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
                QueryKey.INTERLOCUTORS
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
export default CadenceDashboard
