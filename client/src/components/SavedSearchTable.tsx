import { SEARCH_OBJECT_TYPES } from "actions"
import AttachmentTable from "components/Attachment/AttachmentTable"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
import EventTable from "components/EventTable"
import LocationTable from "components/LocationTable"
import OrganizationTable from "components/OrganizationTable"
import PersonTable from "components/PersonTable"
import PositionTable from "components/PositionTable"
import ReportCollection from "components/ReportCollection"
import TaskTable from "components/TaskTable"
import React from "react"
import utils from "utils"

interface SavedSearchTableProps {
  search: any
}

const SavedSearchTable = (props: SavedSearchTableProps) => {
  const objType = SEARCH_OBJECT_TYPES[props.search.objectType]
  const query = utils.parseJsonSafe(props.search.query)

  const typeConfig = {
    [SEARCH_OBJECT_TYPES.REPORTS]: {
      component: ReportCollection,
      sortBy: "ENGAGEMENT_DATE",
      sortOrder: "DESC",
      paginationKey: "r_saved-search"
    },
    [SEARCH_OBJECT_TYPES.PEOPLE]: {
      component: PersonTable,
      sortBy: "NAME",
      sortOrder: "ASC",
      paginationKey: "per_saved_search"
    },
    [SEARCH_OBJECT_TYPES.ORGANIZATIONS]: {
      component: OrganizationTable,
      sortBy: "NAME",
      sortOrder: "ASC",
      paginationKey: "o_saved_search"
    },
    [SEARCH_OBJECT_TYPES.POSITIONS]: {
      component: PositionTable,
      sortBy: "NAME",
      sortOrder: "ASC",
      paginationKey: "pos_saved_search"
    },
    [SEARCH_OBJECT_TYPES.LOCATIONS]: {
      component: LocationTable,
      sortBy: "NAME",
      sortOrder: "ASC",
      paginationKey: "l_saved_search"
    },
    [SEARCH_OBJECT_TYPES.TASKS]: {
      component: TaskTable,
      sortBy: "NAME",
      sortOrder: "ASC",
      paginationKey: "t_saved_search"
    },
    [SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS]: {
      component: AuthorizationGroupTable,
      sortBy: "NAME",
      sortOrder: "ASC",
      paginationKey: "ag_saved_search"
    },
    [SEARCH_OBJECT_TYPES.ATTACHMENTS]: {
      component: AttachmentTable,
      sortBy: "CREATED_AT",
      sortOrder: "DESC",
      paginationKey: "a_saved_search"
    },
    [SEARCH_OBJECT_TYPES.EVENTS]: {
      component: EventTable,
      sortBy: "NAME",
      sortOrder: "ASC",
      paginationKey: "e_saved_search"
    }
  }

  if (typeConfig[objType]) {
    const {
      component: Component,
      sortBy,
      sortOrder,
      paginationKey
    } = typeConfig[objType]
    query.sortBy = query.sortBy || sortBy
    query.sortOrder = query.sortOrder || sortOrder
    query.pageNum = query.pageNum || 0
    query.pageSize = query.pageSize || 10
    return <Component queryParams={query} paginationKey={paginationKey} />
  } else {
    return <em>Unsupported object type: {objType}</em>
  }
}

export default SavedSearchTable
