import React, { Component } from 'react';
import { dataURItoBlob } from "../../../../../../../../utils/handy";
import Webcam from "react-webcam";

import './style.scss';

export class Camera extends Component {
  constructor(props) {
    super(props);
    this.webcam = React.createRef();
    this.state = {
      stage: "ready",
      capturingVideo: false,
      videoConstraints: {
        width: 1280,
        height: 720,
        facingMode: "user"
      }
    };
    this.mediaRecorder = undefined;
    this.onTakePhoto = this.onTakePhoto.bind(this);
    this.onTakeVideo = this.onTakeVideo.bind(this);
    this.cameraSwap = this.cameraSwap.bind(this);
    this.done = this.done.bind(this);
    this.cancel = this.cancel.bind(this);
    this.videoType = "video/webm";
    this.videoExtension = ".webm";

    try {
      if (!MediaRecorder.isTypeSupported(this.videoType)) {
        this.videoType = "video/mpeg";
        this.videoExtension = ".mpeg";
      }
      if (this.props.videoMode) {
        this.captureCb = this.onTakeVideo;
      } else {
        this.captureCb = this.onTakePhoto;
      }
    } catch(err) {
      console.error(err)
      console.error("Likely MediaRecorder not supported for video ... defaulting to picture mode")
      this.props.videoMode = false;
      this.captureCb = this.onTakePhoto;
    }
  }

  cancel() {
    if (this.mediaRecorder) {
      this.mediaRecorder.ondataavailable = undefined;
    }
    this.props.cancelCb();
  }

  done(file) {
    this.props.doneCb(file); //TODO: add button to ok result, and return file or data
  }

  onTakeVideo() {
    this.setState({ capturingVideo: !this.state.capturingVideo });
    if (this.state.capturingVideo) {
      this.mediaRecorder.stop();
    } else {
      let recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.webcam.stream, { mimeType: this.videoType }); //TODO fix for incompatible with MediaRecorder
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
          var videoBlob = new Blob(recordedChunks, { type: this.videoType });
          var file = new File([videoBlob], "cameraCapture" + this.videoExtension, { type: this.videoType, lastModified: new Date() })
          this.done(file);
        } else {
          logger.error("No data available to produce video");
          this.cancel();
        }
      }
      this.mediaRecorder.start();
    }
  }

  onTakePhoto() {
    const shot64 = this.webcam.getScreenshot();
    var shotBlob = dataURItoBlob(shot64);
    var file = new File([shotBlob], "cameraCapture.png", { type: "image/png", lastModified: new Date() });
    this.done(file);
  }

  cameraSwap() {
    let faceMode = undefined;
    if (this.state.videoConstraints.facingMode === "environment") { faceMode = "user"; } else { faceMode = "environment"; }

    this.setState(prevState => ({
      videoConstraints: {
        ...prevState.videoConstraints,
        facingMode: faceMode
      }
    }))

    console.debug("videoConstraints", this.state.videoConstraints);
  };

  render() {
    let captureClass = "rw-capture-media";
    if (this.state.capturingVideo) { captureClass = captureClass + " rw-capturing"; }

    return (
      <div className="rw-fill-area">
        <div className="rw-camera-wrapper">
          <Webcam
            ref={node => this.webcam = node}
            audio={false}
            screenshotFormat="image/png"
            videoConstraints={this.state.videoConstraints}
          />
          <div className="rw-camera-controls">
            <button title="Switch camera" aria-label="Switch camera" onClick={this.cameraSwap}><span className="circle">↺</span></button>
            <button title="Take picture" aria-label="Take picture" className={captureClass} onClick={this.captureCb}>&#9711;</button>
            <button title="Cancel" aria-label="Cancel" onClick={this.cancel}><span className="circle">×</span></button>
          </div>
        </div>
      </div>
    )
  }
}