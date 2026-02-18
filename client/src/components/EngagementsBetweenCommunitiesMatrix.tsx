import { gql } from "@apollo/client"
import styled from "@emotion/styled"
import API from "api"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { mapPageDispatchersToProps } from "components/Page"
import _isEmpty from "lodash/isEmpty"
import { Report } from "models"
import AuthorizationGroup from "models/AuthorizationGroup"
import moment from "moment/moment"
import React, { useEffect, useRef, useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GET_ENGAGEMENTS_BETWEEN_COMMUNITIES = gql`
  query (
    $engagementsBetweenCommunitiesQuery: EngagementsBetweenCommunitiesSearchQueryInput
  ) {
    engagementsBetweenCommunities(query: $engagementsBetweenCommunitiesQuery) {
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

function getEngagementColor(engagementDate: string): string {
  const engagementMoment = moment(engagementDate)
  const now = moment()
  const monthsAgo = now.diff(engagementMoment, "months")

  if (monthsAgo < 3) {
    return "#28a745"
  } else if (monthsAgo < 6) {
    return "#6c757d"
  } else if (monthsAgo < 12) {
    return "#ffc107"
  } else if (monthsAgo < 24) {
    return "#fd7e14"
  } else {
    return "#dc3545"
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "")
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

enum EngagementType {
  PLANNED = "planned",
  RECENT = "recent"
}

const GradientDiv = styled.div`
  background-image: ${props =>
    `linear-gradient(90deg, ${props.engagementColor} 0%, ${props.engagementFade} 25%, ${props.engagementFade} 75%, ${props.engagementColor} 100%)`};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-align: center;
`

const WrappedTh = styled.th`
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
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
      engagementsBetweenCommunitiesQuery
    ) {
      setFetchError(null)
      try {
        return await API.query(GET_ENGAGEMENTS_BETWEEN_COMMUNITIES, {
          engagementsBetweenCommunitiesQuery
        })
      } catch (error) {
        setFetchError(error)
      }
    }
    if (authorizationGroupAdvisors && authorizationGroupInterlocutors) {
      setAdvisorEntities(
        authorizationGroupAdvisors.authorizationGroupRelatedObjects
      )
      setInterlocutorEntities(
        authorizationGroupInterlocutors.authorizationGroupRelatedObjects
      )
      const engagementsBetweenCommunitiesQuery = {
        advisorAuthorizationGroupUuid: authorizationGroupAdvisors.uuid,
        interlocutorAuthorizationGroupUuid:
          authorizationGroupInterlocutors.uuid,
        plannedEngagements
      }
      fetchEngagementsBetweenCommunities(
        engagementsBetweenCommunitiesQuery
      ).then(response => {
        setEngagementsBetweenCommunities(response.engagementsBetweenCommunities)
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
    const engagementColor = getEngagementColor(match.engagementDate)
    const engagementFade = hexToRgba(engagementColor, 0.25)
    const report = new Report({
      uuid: match.reportUuid,
      intent: moment(match.engagementDate).format(
        Settings.dateFormats.forms.displayShort.date
      )
    })
    return (
      <GradientDiv
        engagementColor={engagementColor}
        engagementFade={engagementFade}
      >
        <LinkTo modelType="Report" model={report} />
      </GradientDiv>
    )
  }

  return (
    <>
      <Messages error={fetchError} />
      <div className="d-flex mt-3">
        <div className="text-start">
          <label htmlFor="dashboard-type" className="form-label">
            Dashboard Type
          </label>
          <select
            id="dashboard-type"
            value={
              plannedEngagements
                ? EngagementType.PLANNED
                : EngagementType.RECENT
            }
            onChange={e =>
              setPlannedEngagements(e.target.value === EngagementType.PLANNED)
            }
            className="form-select"
          >
            <option value={EngagementType.RECENT}>
              Most Recent Engagements
            </option>
            <option value={EngagementType.PLANNED}>Planned Engagements</option>
          </select>
        </div>
      </div>
      <div className="clearfix mt-3">
        <div
          ref={scrollContainerRef}
          className="w-100"
          style={{ overflowX: "auto", whiteSpace: "nowrap" }}
        >
          <Table
            className="event-matrix"
            responsive
            hover
            id="events-matrix"
            style={{ minWidth: `${advisorEntities.length * 220}px` }}
          >
            <tbody>
              <tr id="event-series-table-header" className="table-primary">
                <th />
                {advisorEntities.map(advisorEntity => (
                  <WrappedTh key={advisorEntity.relatedObjectUuid}>
                    <LinkTo
                      modelType={advisorEntity.relatedObjectType}
                      model={{
                        uuid: advisorEntity.relatedObjectUuid,
                        ...advisorEntity.relatedObject
                      }}
                    />
                  </WrappedTh>
                ))}
              </tr>
              {_isEmpty(interlocutorEntities) ? (
                <tr className="event-series-row">
                  <td colSpan={8}>No interlocutor entities</td>
                </tr>
              ) : (
                interlocutorEntities.map(interlocutorEntity => {
                  return (
                    <tr
                      key={interlocutorEntity.relatedObjectUuid}
                      className="event-series-row"
                    >
                      <WrappedTh>
                        <LinkTo
                          modelType={interlocutorEntity.relatedObjectType}
                          model={{
                            uuid: interlocutorEntity.relatedObjectUuid,
                            ...interlocutorEntity.relatedObject
                          }}
                        />
                      </WrappedTh>
                      {advisorEntities.map(advisorEntity => (
                        <td
                          key={`${interlocutorEntity.relatedObjectUuid}-${advisorEntity.relatedObjectUuid}`}
                        >
                          {getEngagement(
                            advisorEntity.relatedObjectUuid,
                            interlocutorEntity.relatedObjectUuid
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </>
  )
}

export default connect(
  null,
  mapPageDispatchersToProps
)(EngagementsBetweenCommunitiesMatrix)
