import AppContext from "components/AppContext"
import React, { useContext, useMemo, useState } from "react"
import { Button } from "react-bootstrap"
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride"
import { useNavigate } from "react-router-dom"
import TOUR_ICON from "resources/tour-icon.png"

const iconCss = {
  width: "20px",
  marginLeft: "8px"
}

interface GuidedTourProps {
  tour: (...args: unknown[]) => unknown
  autostart?: boolean
  onEnd?: (...args: unknown[]) => unknown
  title?: string
}

const GuidedTour = ({ autostart, title, tour, onEnd }: GuidedTourProps) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const currentTour = useMemo(
    () => tour(currentUser, navigate),
    [currentUser, tour, navigate]
  )
  const [runningTour, setRunningTour] = useState(autostart && currentUser.uuid)
  const [stepIndex, setStepIndex] = useState(0)
  const titleText = title || "New to ANET? Take a guided tour"
  return (
    <>
      <Button
        variant="link"
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
        disableScrollParentFix
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

export default GuidedTour
