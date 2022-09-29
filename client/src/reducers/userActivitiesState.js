import { SET_USER_ACTIVITIES_STATE } from "../constants/ActionTypes"

const userActivitiesState = (state = {}, action) => {
  switch (action.type) {
    case SET_USER_ACTIVITIES_STATE:
      return Object.assign({}, state, action.userActivitiesState)
    default:
      return state
  }
}

export default userActivitiesState
