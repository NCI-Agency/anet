import React from 'react'
import Avatar from 'react-avatar-edit'

// More info: https://github.com/kirill3333/react-avatar
export default class AvatarComponent extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      preview: null,
      src: props.src,
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
  }

  onBeforeFileLoad(elem) {
    let file = elem.target.files[0]

    if(file.size > 71680){
      alert("File is too big!");
      elem.target.value = "";
    };
  }
  
  render () {
    return (
      <div>
        <Avatar
          width={200}
          height={200}
          onCrop={this.onCrop}
          onClose={this.onClose}
          onBeforeFileLoad={this.onBeforeFileLoad}
          src={this.state.src}
        />
        <img src={this.state.preview} alt="Preview" />
      </div>
    )
  }
}