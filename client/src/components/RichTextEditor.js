import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import {ContentState, CompositeDecorator, Editor, EditorState, RichUtils, convertFromHTML, getDefaultKeyBinding } from 'draft-js'
import { convertToHTML } from 'draft-convert'
import 'draft-js/dist/Draft.css'
import './RichTextEditor.css'

class RichTextEditor extends Component {
	static propTypes = {
		value: PropTypes.string,
		onChange: PropTypes.func.isRequired,
		onHandleBlur: PropTypes.func,
		className: PropTypes.string,
	}

	constructor(props) {
		super(props)
		const decorator = new CompositeDecorator([
			{
				strategy: findImageEntities,
				component: ReactImage,
			},
		])

		this.state = {
			editorState: EditorState.createEmpty(decorator),
			decorator,
			isLoaded: false,
		}
		this.handleOnChangeHTML = this._handleOnChangeHTML.bind(this)
		this.handleKeyCommand = this._handleKeyCommand.bind(this)
		this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this)
		this.toggleBlockType = this._toggleBlockType.bind(this)
		this.toggleInlineStyle = this._toggleInlineStyle.bind(this)
		this.setEditorStateFromHTML = this._setEditorStateFromHTML.bind(this)
		this.initializeEditorState = this._initializeEditorState.bind(this)

		this.focus = () => this.refs.editor.focus()
		this.onChange = (editorState) => this.setState({editorState}, this.handleOnChangeHTML)
	}

	componentDidUpdate() {
		this.initializeEditorState()
	}

	componentDidMount() {
		this.initializeEditorState()
	}

	_initializeEditorState() {
		const { isLoaded } = this.state
		const { value } = this.props
		const valueString = value || ''
		if (!isLoaded && valueString.length > 0) {
			this.setState({isLoaded: true}, this.setEditorStateFromHTML(value))
		}
	}

	_handleOnChangeHTML() {
		const { editorState } = this.state
		const html = convertToHTML({
			entityToHTML: (entity, originalText) => {
				if (entity.type === 'IMAGE') {
					const { src, width, height, alt } = entity.data
					return <img src={imageDataSrc(src)} width={width} height={height} alt={alt} />
				}
				return originalText
			}
		})(editorState.getCurrentContent())
		this.props.onChange(html)
	}

	handlePastedText = (text, html) => {
		const htmlRegex = new RegExp(/<[a-z][\s\S]*>/i)
		if(htmlRegex.test(html)) {
			this.setEditorStateFromHTML(html)
		} else {
			const contentState = ContentState.createFromText(text)
			const editorState = EditorState.push(this.state.editorState, contentState, 'change-block-data')
			this.onChange(editorState)
		}
		return true
	}

	_setEditorStateFromHTML(html) {
		const blocksFromHTML = convertFromHTML(html)
		if (blocksFromHTML.contentBlocks === null) { return }
		const contentState = ContentState.createFromBlockArray(
			blocksFromHTML.contentBlocks,
			blocksFromHTML.entityMap,
		)
		const editorState = EditorState.push(this.state.editorState, contentState, 'change-block-data')
		this.onChange(editorState)
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
			<div className={classNames("RichEditor-root", this.props.className)}>
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
						handlePastedText={this.handlePastedText}
						handleKeyCommand={this.handleKeyCommand}
						keyBindingFn={this.mapKeyToEditorCommand}
						onChange={this.onChange}
						onBlur={this.props.onHandleBlur}
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

function imageDataSrc(src) {
	const canvas = document.createElement('canvas')
	const image = new Image()
	image.onload = function() {
		const ctx = canvas.getContext('2d')
		canvas.width = image.naturalWidth
		canvas.height = image.naturalHeight
		ctx.drawImage(image, 0, 0)
	}
	image.crossOrigin = "Anonymous"
	image.src = src
	// Convert to in-line data
	return !src.startsWith('data:') ? canvas.toDataURL('image/jpeg') : src
}

const ReactImage = (props) => {
		const {
			height,
			src,
			width,
			alt,
		} = props.contentState.getEntity(props.entityKey).getData()
		return (
			<img src={imageDataSrc(src)} height={height} width={width} alt={alt} />
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
