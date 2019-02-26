import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import RichTextEditor from '../src/components/RichTextEditor'

storiesOf('Rich Text Editor', module)
	.add('default', () => <RichTextEditor onChange={action('editor-click')}/>)
