import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {CompositeDecorator, Editor, EditorState, RichUtils, getDefaultKeyBinding } from 'draft-js'
import { convertFromHTML, convertToHTML } from 'draft-convert'
import 'draft-js/dist/Draft.css'
import './RichTextEditor.css'

class RichTextEditor extends Component {
	static propTypes = {
		value: PropTypes.string,
		onChange: PropTypes.func,
	}
	constructor(props) {
		super(props)
		const decorator = new CompositeDecorator([
			{
				strategy: findImageEntities,
				component: ImageCanvas,
			},
		])

		const editorState = EditorState.createEmpty(decorator)
		this.state = {editorState, decorator, isLoaded: false, value: ''}

		this.focus = () => this.refs.editor.focus()
		this.onChange = (editorState) => this.setState({editorState}, this.handleOnChangeHTML(editorState))

		this.handleOnChangeHTML = this._handleOnChangeHTML.bind(this)
		this.handleKeyCommand = this._handleKeyCommand.bind(this)
		this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this)
		this.toggleBlockType = this._toggleBlockType.bind(this)
		this.toggleInlineStyle = this._toggleInlineStyle.bind(this)
		this.setEditorStateFromHTML = this._setEditorStateFromHTML.bind(this)
	}

	componentDidUpdate() {
		const { value } = this.props
		if(value !== undefined && value.length > 0) {
			this.setEditorStateFromHTML(value)
		}
	}

	_handleOnChangeHTML(editorState) {
		const html = convertToHTML(editorState.getCurrentContent())
		this.props.onChange(html)
	}

	_setEditorStateFromHTML(html) {
		if(this.state.isLoaded) { return }
		const contentState = convertFromHTML(html)
		const editorState = EditorState.createWithContent(contentState, this.state.decorator)
		this.setState(
			{
				isLoaded: true,
				editorState,
			}
		)
	}

	_handleKeyCommand(command, editorState) {
		const newState = RichUtils.handleKeyCommand(editorState, command)
		if (newState) {
			this.onChange(newState)
			return true
		}
		return false
	}

	_mapKeyToEditorCommand(e) {
		if (e.keyCode === 9 /* TAB */) {
			const newEditorState = RichUtils.onTab(
				e,
				this.state.editorState,
				4, /* maxDepth */
			)
			if (newEditorState !== this.state.editorState) {
				this.onChange(newEditorState)
			}
			return
		}
		return getDefaultKeyBinding(e)
	}

	_toggleBlockType(blockType) {
		this.onChange(
			RichUtils.toggleBlockType(
				this.state.editorState,
				blockType
			)
		)
	}

	_toggleInlineStyle(inlineStyle) {
		this.onChange(
			RichUtils.toggleInlineStyle(
				this.state.editorState,
				inlineStyle
			)
		)
	}

	render() {
		const {editorState} = this.state

		// If the user changes block type before entering any text, we can
		// either style the placeholder or hide it. Let's just hide it now.
		let className = 'RichEditor-editor'
		var contentState = editorState.getCurrentContent()
		if (!contentState.hasText()) {
			if (contentState.getBlockMap().first().getType() !== 'unstyled') {
				className += ' RichEditor-hidePlaceholder'
			}
		}

		return (
			<div className="RichEditor-root">
				<BlockStyleControls
					editorState={editorState}
					onToggle={this.toggleBlockType}
				/>
				<InlineStyleControls
					editorState={editorState}
					onToggle={this.toggleInlineStyle}
				/>
				<div className={className} onClick={this.focus}>
					<Editor
						blockStyleFn={getBlockStyle}
						editorState={editorState}
						handleKeyCommand={this.handleKeyCommand}
						keyBindingFn={this.mapKeyToEditorCommand}
						onChange={this.onChange}
						placeholder="..."
						ref="editor"
						spellCheck
					/>
				</div>
			</div>
		)
	}
}

// Custom overrides for "code" style.
function getBlockStyle(block) {
	switch (block.getType()) {
		case 'blockquote': return 'RichEditor-blockquote'
		default: return null
	}
}

function findImageEntities(contentBlock, callback, contentState) {
	contentBlock.findEntityRanges(
		(character) => {
			const entityKey = character.getEntity()
			return (
				entityKey !== null &&
				contentState.getEntity(entityKey).getType() === 'IMAGE'
			)
		},
		callback
	)
}

function toDataURL(src, callback) {
	var xhttp = new XMLHttpRequest()

	xhttp.onload = function() {
			var fileReader = new FileReader()
			fileReader.onloadend = function() {
					callback(fileReader.result)
			}
			fileReader.readAsDataURL(xhttp.response)
	}

	xhttp.responseType = 'blob'
	xhttp.open('GET', src, true)
	xhttp.send()
}

const Image = (props) => {
	const {
		height,
		width,
		src,
		alt,
	} = props.contentState.getEntity(props.entityKey).getData()

	toDataURL(src, (dataUrl) => {
		console.log(dataUrl)
	})
	return (
		<img src={src} height={height} width={width} alt={alt} />
	)
}

const ImageCanvas = (props) => {
		const {
			height,
			src,
			width,
			alt,
		} = props.contentState.getEntity(props.entityKey).getData()

		const image = document.createElement('img')
		image.crossOrigin = "Anonymous"
		image.src = src
		image.width = width
		image.height = height
		image.alt = alt

		image.onload = function() {
			const canvas = document.createElement('canvas')
			const context = canvas.getContext('2d')
			canvas.height = height
			canvas.width = width
			context.drawImage(image, 0, 0)
			return canvas.toDataURL('image/jpeg')
		}
		const dataSrc = image.onload()
		return (
			<img src={src} height={height} width={width} alt={alt} />
		)
}

class StyleButton extends React.Component {
	constructor() {
		super()
		this.onToggle = (e) => {
			e.preventDefault()
			this.props.onToggle(this.props.style)
		}
	}

	render() {
		let className = 'RichEditor-styleButton'
		if (this.props.active) {
			className += ' RichEditor-activeButton'
		}

		return (
			<span className={className} onMouseDown={this.onToggle}>
				{this.props.label}
			</span>
		)
	}
}

const BLOCK_TYPES = [
	{label: 'H1', style: 'header-one'},
	{label: 'H2', style: 'header-two'},
	{label: 'H3', style: 'header-three'},
	{label: 'H4', style: 'header-four'},
	{label: 'H5', style: 'header-five'},
	{label: 'H6', style: 'header-six'},
	{label: 'Blockquote', style: 'blockquote'},
	{label: 'UL', style: 'unordered-list-item'},
	{label: 'OL', style: 'ordered-list-item'},
]

const BlockStyleControls = (props) => {
	const {editorState} = props
	const selection = editorState.getSelection()
	const blockType = editorState
		.getCurrentContent()
		.getBlockForKey(selection.getStartKey())
		.getType()

	return (
		<div className="RichEditor-controls">
			{BLOCK_TYPES.map((type) =>
				<StyleButton
					key={type.label}
					active={type.style === blockType}
					label={type.label}
					onToggle={props.onToggle}
					style={type.style}
				/>
			)}
		</div>
	)
}

const INLINE_STYLES = [
	{label: 'Bold', style: 'BOLD'},
	{label: 'Italic', style: 'ITALIC'},
	{label: 'Underline', style: 'UNDERLINE'},
]

const InlineStyleControls = (props) => {
	const currentStyle = props.editorState.getCurrentInlineStyle()

	return (
		<div className="RichEditor-controls">
			{INLINE_STYLES.map((type) =>
				<StyleButton
					key={type.label}
					active={currentStyle.has(type.style)}
					label={type.label}
					onToggle={props.onToggle}
					style={type.style}
				/>
			)}
		</div>
	)
}

export default RichTextEditor
