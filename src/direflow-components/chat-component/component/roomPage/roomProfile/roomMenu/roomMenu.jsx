import React, { useState, useEffect } from "react";
import { Styled } from "direflow-component";
import styles from "./roomMenu.css";
import {
  roomLeaveIcon,
} from "../../../../imgs/index";
import { loadingIcon, moreIcon } from "../../../../imgs/svgs";
import { api } from "../../../../api";

const RoomMenu = ({ room, onLeave, closeModalms }) => {
  const [showSetBox, setShowSetBox] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showSetBox) {
      setShowSetBox(false)
    }
  }, [closeModalms]);

  const handleMenuClick = (type) => {
    setShowSetBox(false);
    setShowDialog(true);
  }

  const onClickCancel = () => {
    if (!loading) {
      setShowDialog(false);
    }
  }

  const onClickLeave = () => {
    if (!loading) {
      setLoading(true);
      api.leave(room.roomId, () => {
        onLeave();
      })
    }
  }

  return (
    <Styled styles={styles}>
      <div className="chat_widget-menu">
        <div
          className="chat_widget-menu-btn svg-btn svg-btn-fill"
          onClick={(e) => {
            e.stopPropagation();
            setShowSetBox(!showSetBox);
          }}
        >
          {moreIcon}
        </div>
        {showSetBox && (
          <div className="chat_widget_title_setBox" onClick={(e) => { e.stopPropagation() }}>
            <div className="chat_widget_title_setBox_item" onClick={() => handleMenuClick('leave')}>
              <img src={roomLeaveIcon} />
              <span>Leave Room</span>
            </div>
          </div>
        )}
        {showDialog && (
          <div className="room-menu-modal">
            <div className="room-menu-dialog">
              <div className="dialog-content">
                Are you certain about<br />leaving the room?
              </div>
              <div className="dialog-btns">
                <div className="dialog-btn btn-cancel" onClick={onClickCancel}>Cancel</div>
                <div className="divider"></div>
                <div className="dialog-btn btn-leave" onClick={onClickLeave}>Leave</div>
              </div>
            </div>
            {loading && <div className="loading">
              {loadingIcon}
            </div>}
          </div>
        )}

      </div>
    </Styled>
  );
};

export default RoomMenu;
