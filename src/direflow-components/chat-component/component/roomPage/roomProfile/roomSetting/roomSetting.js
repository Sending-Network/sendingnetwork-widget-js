import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomSetting.css";
import { api } from "../../../../api";
import { showToast, calculateRoomName } from "../../../../utils";

const RoomSetting = ({ room = {}, onLeave, refreshRoomName }) => {
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    const tmpName = calculateRoomName(room);
    setName(tmpName);
  }, [])

  const roomNameClick = () => {
    if (!name) {
      showToast({
        type: 'info',
        msg: 'the input name is null'
      })
      return;
    }
    if (!room || !room.roomId) {
      showToast({
        type: 'error',
        msg: 'room info check fail'
      })
      return;
    }
    api._client.setRoomName(room.roomId, name, () => {
      showToast({
        type: 'success',
        msg: 'Success',
      })
      refreshRoomName(name);
    })
  }

  const descriptionClick = () => {
    if (!desc) {
      showToast({
        type: 'info',
        msg: 'the input desc is null'
      })
      return;
    }
    showToast({
      type: 'success',
      msg: 'Success',
    })
  }

  return (
    <Styled styles={styles}>
      <div className="room_setting">
        <div className="room_setting_wrap">
          {/* room name */}
          <p className="room_setting_label">Room Name</p>
          <div className="room_setting_input_box">
            <input
              className="room_setting_input"
              defaultValue={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* room description */}
          {/* <p className="room_setting_label">Room Description</p>
          <div className="room_setting_input_box">
            <input
              className="room_setting_input"
              defaultValue={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <button onClick={descriptionClick}>Save</button>
          </div> */}
        </div>

        <div className="room_setting_save" onClick={roomNameClick}>Save</div>
        {/* leave btn */}
        <div className="room_setting_leave" onClick={() => setShowDialog(true)}>Leave Room</div>

        {/* leave dialog */}
        {showDialog && (
          <div className="room_setting_dialog">
            <div className="room_setting_dialog_content">
              <div className="info">
                <p className="info-title">Leave Room</p>
                <p className="info-desc">Are you certain about leaving the room?</p>
              </div>
              <div className="btns">
                <div className="btns-item btns-cancel" onClick={() => setShowDialog(false)}>Cancel</div>
                <div className="btns-item btns-confirm" onClick={() => onLeave()}>Leave</div>
              </div>
            </div>
          </div>
        )}
			</div>
		</Styled>
  );
};

export default RoomSetting;