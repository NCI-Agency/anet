import React from 'react'
import { Button } from 'react-bootstrap'
import REMOVE_ICON from 'resources/delete.png'

const RemoveButton = ({title, handleOnClick, ...props}) => {
	return <Button
		{...props}
		bsStyle="link"
		title={title}
		onClick={handleOnClick}
	>
		<img src={REMOVE_ICON} height={14} alt="Remove attendee" />
	</Button>
}

export default RemoveButton
