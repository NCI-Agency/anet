import styled from "@emotion/styled"
import { changeView, changeViewDate } from "components/Calendar/actions"
import PropTypes from "prop-types"
import React from "react"

const Header = ({ state, dispatch, views }) => {
  return (
    <HeaderBox>
      <Buttons>
        <button onClick={() => state.prevAction(dispatch, state)}>Prev</button>
        <button onClick={() => dispatch(changeViewDate(new Date()))}>
          Today
        </button>
        <button onClick={() => state.nextAction(dispatch, state)}>Next</button>
      </Buttons>
      <span>{state.title}</span>
      <ViewSelect>
        <label htmlFor="viewsSelect">View Options</label>
        <select
          name="views"
          id="viewsSelect"
          style={{ cursor: "pointer" }}
          onChange={e => dispatch(changeView(e.target.value))}
          value={state.view}
        >
          {views.map(view => (
            <option key={view} value={view}>
              {view}
            </option>
          ))}
        </select>
      </ViewSelect>
    </HeaderBox>
  )
}

Header.propTypes = {
  state: PropTypes.object,
  dispatch: PropTypes.func,
  views: PropTypes.arrayOf(PropTypes.string)
}

const HeaderBox = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px auto;
  margin: 5px 1rem;
`

const Buttons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  & > * {
    margin-left: 5px;
    margin-right: 5px;
  }
`

const ViewSelect = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  & > * {
    margin-left: 5px;
    margin-right: 5px;
  }
`

export default Header
