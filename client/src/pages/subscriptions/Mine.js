import MySubscriptions from "components/MySubscriptions"
import MySubscriptionUpdates from "components/MySubscriptionUpdates"
import React, { useState } from "react"

const Mine = () => {
  const [forceRefetchSubscriptionUpdates, setForceRefetchSubscriptionUpdates] =
    useState(false)
  const [forceRefetchSubscriptions, setForceRefetchSubscriptions] =
    useState(false)
  return (
    <>
      <MySubscriptionUpdates
        forceRefetch={forceRefetchSubscriptionUpdates}
        setForceRefetch={setForceRefetchSubscriptionUpdates}
        refetchCallback={() => setForceRefetchSubscriptions(true)}
      />
      <MySubscriptions
        forceRefetch={forceRefetchSubscriptions}
        setForceRefetch={setForceRefetchSubscriptions}
        refetchCallback={() => setForceRefetchSubscriptionUpdates(true)}
      />
    </>
  )
}

export default Mine
