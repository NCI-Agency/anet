import AppContext from "components/AppContext"
import hopscotch from "hopscotch"
import "hopscotch/dist/css/hopscotch.css"
import React, { useCallback, useContext, useEffect, useState } from "react"
import { Button } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import TOUR_ICON from "resources/tour-icon.png"

const iconCss = {
  width: "20px",
  marginLeft: "8px"
}

const HOPSCOTCH_CONFIG = {
  bubbleWidth: 400
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
  const [runningTour, setRunningTour] = useState(false)
  const startTour = useCallback(() => {
    // I don't know why hopscotch requires itself to be reconfigured
    // EVERY TIME you start a tour, but it does. so this does that.
    hopscotch.configure(HOPSCOTCH_CONFIG)
    hopscotch.startTour(tour(currentUser, navigate))
    setRunningTour(true)
  }, [currentUser, tour, navigate])
  useEffect(() => {
    hopscotch.listen("end", handleOnEnd)
    hopscotch.listen("close", handleOnEnd)
    if (!runningTour && autostart && currentUser.uuid) {
      startTour()
    }

    return () => {
      hopscotch.unlisten("end", handleOnEnd)
      hopscotch.unlisten("close", handleOnEnd)
      if (runningTour) {
        hopscotch.endTour()
        handleOnEnd()
        setRunningTour(false)
      }
    }

    function handleOnEnd() {
      if (onEnd) {
        onEnd()
      }
    }
  }, [autostart, currentUser.uuid, onEnd, runningTour, startTour])

  const titleText = title || "New to ANET? Take a guided tour"
  return (
    <Button
      variant="link"
      onClick={startTour}
      className="persistent-tour-launcher"
    >
      {titleText}
      <img src={TOUR_ICON} className="tour-icon" alt="" style={iconCss} />
    </Button>
  )
}

export default GuidedTour
