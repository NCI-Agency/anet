import { gql } from "@apollo/client"
import API from "api"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { mapPageDispatchersToProps } from "components/Page"
import _isEmpty from "lodash/isEmpty"
import { Report } from "models"
import AuthorizationGroup from "models/AuthorizationGroup"
import moment from "moment/moment"
import React, { useEffect, useRef, useState } from "react"
import { connect } from "react-redux"
import Settings from "settings"

const GET_ENGAGEMENTS_BETWEEN_COMMUNITIES = gql`
  query (
    $getEngagementsBetweenCommunitiesQuery: EngagementsBetweenCommunitiesSearchQueryInput
  ) {
    getEngagementsBetweenCommunities(
      query: $getEngagementsBetweenCommunitiesQuery
    ) {
      engagementDate
      reportUuid
      advisor {
        relatedObjectType
        relatedObjectUuid
      }
      interlocutor {
        relatedObjectType
        relatedObjectUuid
      }
    }
  }
`

interface EngagementsBetweenCommunitiesMatrixProps {
  authorizationGroupAdvisors: AuthorizationGroup
  authorizationGroupInterlocutors: AuthorizationGroup
}

const EngagementsBetweenCommunitiesMatrix = ({
  authorizationGroupAdvisors,
  authorizationGroupInterlocutors
}: EngagementsBetweenCommunitiesMatrixProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [advisorEntities, setAdvisorEntities] = useState([])
  const [interlocutorEntities, setInterlocutorEntities] = useState([])
  const [plannedEngagements, setPlannedEngagements] = useState(false)
  const [engagementsBetweenCommunities, setEngagementsBetweenCommunities] =
    useState([])
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    async function fetchEngagementsBetweenCommunities(
      getEngagementsBetweenCommunitiesQuery
    ) {
      try {
        return await API.query(GET_ENGAGEMENTS_BETWEEN_COMMUNITIES, {
          getEngagementsBetweenCommunitiesQuery
        })
      } catch (error) {
        setFetchError(error)
      }
    }

    const typeOrder = { organizations: 1, positions: 2, people: 3 }

    const getSortableName = obj => {
      const ro = obj?.relatedObject
      if (!ro) {
        return ""
      }
      return obj.relatedObjectType === "organizations"
        ? ro.shortName || ""
        : ro.name || ""
    }

    const sortRelatedObjects = arr =>
      arr.slice().sort((a, b) => {
        const typeCompare =
          (typeOrder[a.relatedObjectType] ?? 999) -
          (typeOrder[b.relatedObjectType] ?? 999)
        if (typeCompare !== 0) {
          return typeCompare
        }
        return getSortableName(a).localeCompare(getSortableName(b))
      })

    if (authorizationGroupAdvisors && authorizationGroupInterlocutors) {
      const sortedAdvisorEntities = sortRelatedObjects(
        authorizationGroupAdvisors.authorizationGroupRelatedObjects
      )
      const sortedInterlocutorEntities = sortRelatedObjects(
        authorizationGroupInterlocutors.authorizationGroupRelatedObjects
      )
      setAdvisorEntities(sortedAdvisorEntities)
      setInterlocutorEntities(sortedInterlocutorEntities)

      const query = {
        advisorAuthorizationGroupUuid: authorizationGroupAdvisors.uuid,
        interlocutorAuthorizationGroupUuid:
          authorizationGroupInterlocutors.uuid,
        plannedEngagements
      }
      fetchEngagementsBetweenCommunities(query).then(response => {
        setEngagementsBetweenCommunities(
          response.getEngagementsBetweenCommunities
        )
      })
    }
  }, [
    authorizationGroupAdvisors,
    authorizationGroupInterlocutors,
    plannedEngagements
  ])

  function getEngagement(advisorEntityUuid, interlocutorEntityUuid) {
    const match = engagementsBetweenCommunities.find(
      e =>
        e.advisor?.relatedObjectUuid === advisorEntityUuid &&
        e.interlocutor?.relatedObjectUuid === interlocutorEntityUuid
    )
    if (!match) {
      return null
    }
    const report = new Report({
      uuid: match.reportUuid,
      intent: moment(match.engagementDate).format(
        Settings.dateFormats.forms.displayShort.date
      )
    })
    return <LinkTo modelType="Report" model={report} />
  }

  return (
    <>
      <Messages error={fetchError} />
      <div style={{ display: "flex", marginTop: "1rem" }}>
        <div style={{ textAlign: "left" }}>
          <label
            htmlFor="dashboard-type"
            style={{
              fontWeight: "bold",
              marginRight: "0.5rem",
              display: "block"
            }}
          >
            Dashboard Type
          </label>
          <select
            id="dashboard-type"
            value={plannedEngagements ? "planned" : "recent"}
            onChange={e => setPlannedEngagements(e.target.value === "planned")}
            className="form-select"
            style={{ width: "250px" }}
          >
            <option value="recent">Most Recent Engagements</option>
            <option value="planned">Planned Engagements</option>
          </select>
        </div>
      </div>
      <div className="matrix-container">
        <div ref={scrollContainerRef} className="matrix-scroll-container">
          <div
            className="matrix-table-wrapper"
            style={{ minWidth: `${advisorEntities.length * 300}px` }}
          >
            <table className="event-matrix header-table">
              <thead>
                <tr>
                  <th
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 10,
                      background: "#cfe2ff",
                      minWidth: "200px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      verticalAlign: "top"
                    }}
                  />
                  {advisorEntities.map(a => (
                    <th key={a.relatedObjectUuid}>
                      <LinkTo
                        modelType={a.relatedObjectType}
                        model={{
                          uuid: a.relatedObjectUuid,
                          ...a.relatedObject
                        }}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
            <table className="event-matrix body-table">
              <tbody>
                {_isEmpty(interlocutorEntities) ? (
                  <tr>
                    <td colSpan={advisorEntities.length + 1}>
                      No interlocutor entities
                    </td>
                  </tr>
                ) : (
                  interlocutorEntities.map(i => (
                    <tr key={i.relatedObjectUuid}>
                      <td>
                        <LinkTo
                          modelType={i.relatedObjectType}
                          model={{
                            uuid: i.relatedObjectUuid,
                            ...i.relatedObject
                          }}
                        />
                      </td>
                      {advisorEntities.map(a => (
                        <td
                          key={`${i.relatedObjectUuid}-${a.relatedObjectUuid}`}
                        >
                          {getEngagement(
                            a.relatedObjectUuid,
                            i.relatedObjectUuid
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default connect(
  null,
  mapPageDispatchersToProps
)(EngagementsBetweenCommunitiesMatrix)
