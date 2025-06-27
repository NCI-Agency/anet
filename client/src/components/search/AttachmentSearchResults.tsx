import { gql } from "@apollo/client"
import API from "api"
import AttachmentTable from "components/Attachment/AttachmentTable"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import {
  DEFAULT_PAGESIZE
} from "components/search/common"
import _isEqual from "lodash/isEqual"
import { Attachment } from "models"
import React, { useEffect, useRef, useState } from "react"

const GQL_GET_ATTACHMENT_LIST = gql`
  query ($attachmentQuery: AttachmentSearchQueryInput) {
    attachmentList(query: $attachmentQuery) {
      totalCount
      pageNum
      pageSize
      list {
        ${Attachment.basicFieldsQuery}
        author {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        attachmentRelatedObjects {
          relatedObject {
            ... on AuthorizationGroup {
              name
            }
            ... on Location {
              name
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
            ... on Organization {
              shortName
              longName
              identificationCode
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
            ... on Person {
              name
              rank
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
            ... on Position {
              type
              name
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
            ... on Report {
              intent
            }
            ... on Task {
              shortName
              longName
            }
          }
          relatedObjectUuid
          relatedObjectType
        }
      }
    }
  }
`

interface AttachmentSearchResultsProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
}

const AttachmentSearchResults = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination
}: AttachmentSearchResultsProps) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    (queryParamsUnchanged && pagination?.[paginationKey]?.pageNum) ?? 0
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination?.(paginationKey, 0)
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const attachmentQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { loading, error, data } = API.useApiQuery(GQL_GET_ATTACHMENT_LIST, {
    attachmentQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.attachmentList?.totalCount
  useEffect(() => setTotalCount?.(totalCount), [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedAttachments = data ? data.attachmentList : []
  const { pageSize, pageNum: curPage, list: attachments } = paginatedAttachments

  return (
    <AttachmentTable
      attachments={attachments}
      pageSize={setPagination && pageSize}
      pageNum={setPagination && curPage}
      totalCount={setPagination && totalCount}
      goToPage={setPagination && setPage}
      showOwner
      id="attachments-search-results"
    />
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }
}

export default AttachmentSearchResults
