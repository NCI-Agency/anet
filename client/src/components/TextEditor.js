import React, {Component} from 'react'
import autobind from 'autobind-decorator'

import AlloyEditor from 'alloyeditor/dist/alloy-editor/alloy-editor-no-react'
import './alloy-editor-atlas.css'

// this just removes a number of features we don't want from the Alloy toolbar
let buttons = AlloyEditor.Selections[3].buttons
buttons.splice(4, 2)
buttons.splice(0, 1)

const ALLOY_CONFIG = {
	toolbars: {
		styles: { selections: AlloyEditor.Selections },
		add: { buttons: ['ul', 'ol', 'hline', 'table'] },
	}
}

export default class TextEditor extends Component {
	componentDidMount() {
		if (!this.editor) {
			this.editor = AlloyEditor.editable(this.container, ALLOY_CONFIG)
			this.nativeEditor = this.editor.get('nativeEditor')
			this.nativeEditor.on('change', this.onChange)
		}

		this.componentDidUpdate()
	}

	componentWillUnmount() {
		if (this.editor && this.nativeEditor && this.nativeEditor.document) {
			this.editor.destroy()
			this.editor = this.nativeEditor = null
		}
	}

	componentDidUpdate(prevProps, prevState) {
		const html = this.props.value
		if (html !== this.nativeEditor.getData()) {
			this.nativeEditor.setData(html)
		}
	}

	@autobind
	onChange(event) {
		const html = this.nativeEditor.getData()
		this.props.onChange(html)
	}

	render() {
		return <div className="text-editor" ref={(el) => { this.container = el }} />
	}
}
