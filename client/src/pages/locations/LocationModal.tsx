import React from "react"
import { Modal } from "react-bootstrap"
import CreateNewLocation from "./CreateNewLocation"

interface LocationModalProps {
  show: boolean
  onHide: () => void
  name?: string
  coords: { lat: number; lng: number } | null
  setFieldTouched: (...args: unknown[]) => unknown
  setFieldValue: (...args: unknown[]) => unknown
}

const LocationModal = ({
  show,
  onHide,
  name,
  coords,
  setFieldTouched,
  setFieldValue
}: LocationModalProps) => {
  const lat = coords?.lat
  const lng = coords?.lng

  return (
    <Modal backdrop="static" centered size="xl" show={show} onHide={onHide}>
      <Modal.Header closeButton />
      <Modal.Body>
        <CreateNewLocation
          name={name}
          lat={lat}
          lng={lng}
          setFieldTouched={setFieldTouched}
          setFieldValue={setFieldValue}
          setDoReset={() => {
            onHide()
          }}
        />
      </Modal.Body>
    </Modal>
  )
}

export default LocationModal
