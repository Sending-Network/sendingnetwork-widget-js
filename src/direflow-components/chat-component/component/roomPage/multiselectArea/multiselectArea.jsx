import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./multiselectArea.css";
import { crossIcon, forwardIcon, copyIcon, deleteIcon } from "../../../imgs/svgs";
import copy from 'copy-to-clipboard';
import { showMessage } from "../../../utils";
import dayjs from "dayjs";

const MultiselectArea = ({
  room,
  selectedMessages,
  onStopSelect,
  setShowForward
}) => {
  const len = selectedMessages?.length || 0;

  const handleForward = () => {
    if (selectedMessages.length) {
      setShowForward();
    }
  }

  const handleCopy = () => {
    if (selectedMessages.length) {
      let result = '';
      let sdnEvent;
      const arr = selectedMessages.sort((a, b) => { return (a.viewIndex || 0) - (b.viewIndex || 0) })
      for (let i = 0; i < arr.length; i++) {
        sdnEvent = arr[i];
        result += '> ' + sdnEvent.sender?.name || sdnEvent.getSender();
        // if (!room.isDmRoom()) {
        //   result += `(${room.name})`;
        // }
        result += ` [${renderTime(sdnEvent.getTs())}]`;
        result += '\n' + sdnEvent.getContent().body + '\n\n';
      }
      result = result.slice(0, result.length - 2);
      copy(result);
      const len = arr.length;
      const tip = `${len} ${len > 1 ? 'messages' : 'message'} copied`;
      showMessage({
        type: 'success',
        msg: tip,
      });
      onStopSelect();
    }
  }

  const handleDelete = () => {
    if (selectedMessages.length) {

    }
  }
  
  const renderTime = (ts) => {
    return dayjs(ts).format('MM/DD/YYYY HH:mm')
  }

  return <Styled styles={styles}>
    <div className="multiselect-area">
      <div className="content">
        <div className="btn-cancel svg-btn svg-btn-fill" onClick={onStopSelect}>
          {crossIcon}
        </div>
        <span className="tip">{`${len} ${len > 1 ? 'messages' : 'message'} selected`}</span>
        <div className={`btn-forward svg-btn svg-btn-stroke ${len ? '' : 'disabled'}`}
          onClick={handleForward}>
          {forwardIcon}
        </div>
        <div className={`btn-copy svg-btn svg-btn-stroke ${len ? '' : 'disabled'}`}
          onClick={handleCopy}>
          {copyIcon}
        </div>
        {/* <div className={`btn-delete svg-btn ${len ? '' : 'disabled'}`}
          onClick={handleDelete}>
          {deleteIcon}
        </div> */}
      </div>
    </div>
  </Styled>
}

export default MultiselectArea;