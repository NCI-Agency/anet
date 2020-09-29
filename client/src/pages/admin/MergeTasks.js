// import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
// import {
//   mapPageDispatchersToProps,
//   PageDispatchersPropType,
//   useBoilerplate
// } from "components/Page"
// import useMergeValidation from "mergeUtils"
// import { Task } from "models"
// import React, { useState } from "react"
// import { connect } from "react-redux"
// import { useHistory } from "react-router-dom"
// const MergeTasks = ({ pageDispatchers }) => {
//   const history = useHistory()
//   const [saveError, setSaveError] = useState(null)
//   const [
//     [position1, position2, mergedPosition],
//     [setPosition1, setPosition2, setMergedPosition]
//   ] = useMergeValidation(null, null, new Task(), "task")

//   useBoilerplate({
//     pageProps: DEFAULT_PAGE_PROPS,
//     searchProps: DEFAULT_SEARCH_PROPS,
//     pageDispatchers
//   })
//   return <div>Hello Merge Tasks</div>
// }
// MergeTasks.propTypes = {
//   pageDispatchers: PageDispatchersPropType
// }
// export default connect(null, mapPageDispatchersToProps)(MergeTasks)
