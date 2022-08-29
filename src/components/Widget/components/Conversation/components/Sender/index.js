import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import TextareaAutosize from 'react-textarea-autosize';
import { Camera } from './components/Camera';
import sendButton from 'assets/Send.svg';
import mediaButton from 'assets/Paperclip.svg';
import pictureButton from 'assets/Picture.svg';
import cameraButton from 'assets/Camera.svg';

import SVG, { Props as SVGProps } from 'react-inlinesvg';

import './style.scss';

const Sender = ({ sendMessage, sendFiles, inputTextFieldHint, disabledInput, userInput }) => {
  const [inputValue, setInputValue] = useState('');
  const [showMediaControls, setShowMediaControls] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [fileProgress, setFileProgress] = useState('');
  const formRef = useRef('');

  /*
  function sxendFile(files, successCb, errorCb) {
    try {
      const formData = new FormData();
      formData.append('deployment', deployment);
      formData.append('eventlogId', sessionId);
      for (const file of files) {
        console.debug("upload f", file);
        formData.append('files',file);
      }
      fetch(upload, { method: 'POST', body: formData })
    }
  }*/

  function mediaCaptureCancel () {
    setShowCamera(false);
  }

  function mediaCaptureDone (file) {
    //console.log("done", file);
    mediaCaptureCancel();

    setInputValue('disable');
    setFileProgress('Sending attachment...');

    const successCb = (result) => {
      setInputValue('');
      setFileProgress('');
    };

    const errorCb = (error) => {
      console.error('Fetch error:', error);
      setFileProgress('Error sending attachment');
      setTimeout(()=>{
        setInputValue('');
        setFileProgress('');
      }, 2000);
    };

    sendFiles([file], successCb, errorCb);
  }

  function handleChange(e) {
    if (e.target.value && e.target.value.length) {
      setShowMediaControls(false);
    }
    setInputValue(e.target.value);
  }

  function handleSubmit(e) {
    sendMessage(e);
    setInputValue('');
    return false;
  }

  function onEnterPress(e) {
    if (e.keyCode === 13 && e.shiftKey === false) {
      e.preventDefault();
      // by dispatching the event we trigger onSubmit
      formRef.current.requestSubmit(); //would not trigger onSubmit
      // formRef.current.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }

  function toggleMediaControls (e) {
    setShowMediaControls(!showMediaControls);
  }

  function renderMediaControls() {
    /*<button className="rw-send rw-media-control" type="button">
      <SVG width="24" height="24" onClick={toggleMediaControls} className="rw-media-icon" src={pictureButton} />
    </button>*/
    if (sendFiles === null) {
      return;
    } else {
      let progressClass = 'rw-file-progress';
      if (fileProgress === 'Sending attachment...') { progressClass += ' rw-animate-flicker'; }
      return (
        <React.Fragment>
          { (fileProgress === '') ? null : <div className={progressClass}><p>{fileProgress}</p></div> }
          { showMediaControls ?
            <React.Fragment>
              <button className="rw-send rw-media-control" type="button">
                <SVG width="24" height="24" onClick={(e)=>{ setShowCamera(true); }} className="rw-media-icon" src={cameraButton} />
              </button>
            </React.Fragment> : null
          }
          <button type="button" onClick={toggleMediaControls} className="rw-send rw-media-control" disabled={(inputValue && inputValue.length > 0)}>
            <SVG width="24" height="24" className="rw-media-icon" src={mediaButton} />
          </button>
        </React.Fragment>
      )
    }
  }

  if (showCamera === true) {
    return (<Camera cancelCb={mediaCaptureCancel} doneCb={mediaCaptureDone} />)
  }

  return (
    userInput === 'hide' ? <div /> : (
      <form ref={formRef} className={`rw-sender${userInput === 'disable' ? ' disabled' : ''}`} onSubmit={handleSubmit}>
        <TextareaAutosize type="text" minRows={1} onKeyDown={onEnterPress} maxRows={3} onChange={handleChange} className="rw-new-message" name="message" placeholder={inputTextFieldHint} disabled={disabledInput || userInput === 'disable'} autoFocus autoComplete="off" />
        {renderMediaControls()}
        <button type="submit" className="rw-send" disabled={!(inputValue && inputValue.length > 0)}>
          <SVG width="24" height="24" className="rw-send-icon" src={sendButton} />
          {/* <Send className="rw-send-icon" ready={!!(inputValue && inputValue.length > 0)} alt="send" /> */}
        </button>
      </form>));
};

const mapStateToProps = state => ({
  userInput: state.metadata.get('userInput')
});

Sender.propTypes = {
  sendMessage: PropTypes.func,
  sendFiles: PropTypes.func,
  inputTextFieldHint: PropTypes.string,
  disabledInput: PropTypes.bool,
  userInput: PropTypes.string
};

export default connect(mapStateToProps)(Sender);
