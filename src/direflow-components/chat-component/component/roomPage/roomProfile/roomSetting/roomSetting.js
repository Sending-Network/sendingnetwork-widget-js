import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomSetting.css";
import { api } from "../../../../api";
import { showToast, calculateRoomName, formatTextLength } from "../../../../utils";
import { AvatarComp, AvatarMutiComp } from "../../../avatarComp/avatarComp";
import { setPageAvatarBg } from "../../../../imgs/index";

const RoomSetting = ({ room = {}, roomName, joinedMembers, openLeaveDialog, refreshRoomName }) => {
  const [name, setName] = useState("")

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

  const renderAvatar = () => {
		if (joinedMembers.length === 2) {
			const list = joinedMembers.filter(v => v.userId !== api.getUserId())
			const anotherUser = list[0] || {};
			return <AvatarComp url={anotherUser?.user?.avatarUrl} />
		} else if (joinedMembers.length >= 3) {
			const urls = [];
			joinedMembers.map(m => {
				if (m && m.user && m.user.avatarUrl) {
					urls.push(m.user.avatarUrl)
				}
			})
			const fillArr = new Array(joinedMembers.length - urls.length).fill(null);
			urls.push(...fillArr)
			return <AvatarMutiComp urls={urls} />
		} else {
			return <AvatarComp />
		}
	}

  return (
    <Styled styles={styles}>
      <div className="room_setting">
        <div className="room_setting_wrap">
          {/* info */}
          <div className="room_profile_info" style={{backgroundImage: `url(${setPageAvatarBg})`}}>
            <div className="info_img_box">
              {renderAvatar()}
            </div>
            <div className="info_room_title">{formatTextLength(roomName, 30, 15)}</div>
            <div className="info_room_roomId">{formatTextLength(room?.roomId, 30, 15)}</div>
            <div className="info_room_station_box"></div>
          </div>
          
          <div className="room_setting_content">
            <div className="room_setting_content_name">
              <p className="room_setting_label">Room Name</p>
              <input
                className="room_setting_input"
                defaultValue={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="room_setting_content_btns">
              <div className="room_setting_save_btn" onClick={roomNameClick}>Save</div>
              <div className="room_setting_leave_btn" onClick={openLeaveDialog}>Leave Room</div>
            </div>
          </div>
        </div>
			</div>
		</Styled>
  );
};

export default RoomSetting;