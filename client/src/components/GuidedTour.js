import AppContext from "components/AppContext"
import PropTypes from "prop-types"
import React, { useContext, useMemo, useState } from "react"
import { Button } from "react-bootstrap"
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride"
import { useHistory } from "react-router-dom"
import TOUR_ICON from "resources/tour-icon.png"

const iconCss = {
  width: "20px",
  marginLeft: "8px"
}

const GuidedTour = ({ autostart, title, tour, onEnd }) => {
  const { currentUser } = useContext(AppContext)
  const history = useHistory()
  const currentTour = useMemo(() => tour(currentUser, history), [
    currentUser,
    tour,
    history
  ])
  const [runningTour, setRunningTour] = useState(autostart && currentUser.uuid)
  const [stepIndex, setStepIndex] = useState(0)
  const titleText = title || "New to ANET? Take a guided tour"
  return (
    <>
      <Button
        bsStyle="link"
        onClick={() => setRunningTour(true)}
        className="persistent-tour-launcher"
      >
        {titleText}
        <img src={TOUR_ICON} className="tour-icon" alt="" style={iconCss} />
      </Button>
      <Joyride
        steps={currentTour.steps}
        stepIndex={stepIndex}
        run={runningTour}
        callback={handleCallback}
        continuous
        scrollToFirstStep
        showSkipButton
        showProgress
        styles={{
          options: {
            zIndex: 10000
          }
        }}
      />
    </>
  )

  function handleCallback(data) {
    const { action, status, step, type } = data
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      if (step.multipage) {
        step.onNext()
      } else {
        setRunningTour(false)
        setStepIndex(0)
        if (onEnd) {
          onEnd()
        }
      }
    } else if (ACTIONS.CLOSE === action) {
      setRunningTour(false)
      setStepIndex(0)
    } else if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      setStepIndex(stepIndex + (ACTIONS.PREV === action ? -1 : 1))
    }
  }
}

GuidedTour.propTypes = {
  tour: PropTypes.func.isRequired,
  autostart: PropTypes.bool,
  onEnd: PropTypes.func,
  title: PropTypes.string
}

export default GuidedTour
