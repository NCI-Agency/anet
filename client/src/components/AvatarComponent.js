import React from 'react'
import Avatar from 'react-avatar-edit'
import { Settings } from "api"

// More info about this component: https://github.com/kirill3333/react-avatar
export default class AvatarComponent extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      preview: null,
      values: props.values,
      src: (props.src != null ? props.src : ''),
      showPreview: props.showPreview
    }
    this.onCrop = this.onCrop.bind(this)
    this.onClose = this.onClose.bind(this)
    this.onBeforeFileLoad = this.onBeforeFileLoad.bind(this)
  }
  
  onClose() {
    this.setState({preview: null})
  }
  
  onCrop(preview) {
    this.setState({preview})
    this.state.values.avatar = preview.substring("data:image/jpeg;base64,".length - 1)
  }

  onBeforeFileLoad(elem) {
    let file = elem.target.files[0]

    if(file.size > Settings.imagery.avatar.maxFileSize) {
      alert("File is too big!");
      elem.target.value = "";
    };
  }
  
  render() {
    let previewImage = null
    if (this.state.showPreview) {
      previewImage = 
        <div style={{float: 'left'}}>
          <div style={{fontWeight: 'bold'}}>Preview</div>
          <img src={this.state.preview} alt="Preview" />   
        </div>  
    }

    let avatarWidth = Settings.imagery.avatar.width
    let avatarHeight = Settings.imagery.avatar.height 

    return (
      <div style={{display: 'inline', margin: 'auto'}}>        
        <div style={{float: 'rigth'}}>
          <Avatar
            width={avatarWidth}
            height={avatarHeight}
            minCropRadius={Math.min(avatarWidth, avatarHeight) / 2}
            cropRadius={Math.min(avatarWidth, avatarHeight) / 2}
            onCrop={this.onCrop}
            onClose={this.onClose}
            onBeforeFileLoad={this.onBeforeFileLoad}
            src={`data:image/jpeg;base64,${this.state.src}`}
          />
        {previewImage}
        </div>
      </div>
    )
  }
}