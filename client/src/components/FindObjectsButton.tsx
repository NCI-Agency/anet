import { setSearchQuery } from "actions"
import { deserializeQueryParams } from "components/SearchFilters"
import React from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"

interface FindObjectsButtonProps {
  setSearchQuery: (...args: unknown[]) => unknown
  objectLabel: string
  searchText: string
}

const FindObjectsButton = ({
  setSearchQuery,
  objectLabel,
  searchText
}: FindObjectsButtonProps) => {
  const navigate = useNavigate()
  return (
    <Button
      value="find"
      variant="primary"
      title={`Find this ${objectLabel} in ANET`}
      onClick={doFind}
    >
      Find
    </Button>
  )

  function doFind() {
    const queryParams = { text: searchText }
    deserializeQueryParams(null, queryParams, deserializeCallback)
  }

  function deserializeCallback(objectType, filters, text) {
    // Update the Redux state
    setSearchQuery({ objectType, filters, text })
    navigate("/search")
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery))
})

export default connect(null, mapDispatchToProps)(FindObjectsButton)
