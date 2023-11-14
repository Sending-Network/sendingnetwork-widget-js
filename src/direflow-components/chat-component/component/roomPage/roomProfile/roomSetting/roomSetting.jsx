import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomSetting.css";
import { api } from "../../../../api";
import { showToast, calculateRoomName, calculateRoomTopic, calculateRemark, calculateNickName, formatTextLength } from "../../../../utils";
import RoomAvatar from "../../../roomAvatar/roomAvatar";
import { setPageAvatarBg } from "../../../../imgs/index";
const EventType = {
  RemarkedRoomList: "m.remarked_room_list"
}

const RoomSetting = ({ room = {}, roomName, joinedMembers, refreshRoomName, refreshRoomTopic, refreshRemark, refreshNickName }) => {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [remark, setRemark] = useState("");
  const [nickName, setNickName] = useState("");

  useEffect(() => {
    const tmpName = calculateRoomName(room);
    setName(tmpName);
    const tmpTopic = calculateRoomTopic(room);
    setTopic(tmpTopic);
    const tmpRemark = calculateRemark(room);
    setRemark(tmpRemark);
    const tmpNickName = calculateNickName(room);
    setNickName(tmpNickName);
  }, [])

  const _setNickName = (nickName) => {
    const spaceRoom = room.getParentRoom();
    const displayName = '';

    if (spaceRoom) {
      room = spaceRoom;
    }
    return room._setNickName(nickName || displayName);
  }

  const roomNameClick = async () => {
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
    api._client.setRoomName(room.roomId, name)
    refreshRoomName(name);
    await api._client.setRoomTopic(room.roomId, topic)
    refreshRoomTopic(topic);
    const currentRemarkNameMap = api._client
      .getAccountData(EventType.RemarkedRoomList)
      ?.getContent()?.remarked_room || {};
    currentRemarkNameMap[room.roomId] = {
      remark: remark,
    };
    await api._client.setAccountData(EventType.RemarkedRoomList, {
      remarked_room: currentRemarkNameMap,
    });
    refreshRemark(name);
    await _setNickName(nickName);
    refreshNickName(name);

    showToast({
      type: 'success',
      msg: 'Success',
    })
  }

  return (
    <Styled styles={styles}>
      <div className="room_setting">
        <div className="room_setting_wrap">
          {/* info */}
          <div className="room_profile_info" style={{backgroundImage: `url(${setPageAvatarBg})`}}>
            <div className="info_img_box">
            {(room && room.roomId) ? <RoomAvatar room={room} /> : null}
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
            <div className="room_setting_content_name">
              <p className="room_setting_label">Room Topic</p>
              <input
                className="room_setting_input"
                defaultValue={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="room_setting_content_name">
              <p className="room_setting_label">Remark</p>
              <input
                className="room_setting_input"
                defaultValue={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
            <div className="room_setting_content_name">
              <p className="room_setting_label">My Alias in Room</p>
              <input
                className="room_setting_input"
                defaultValue={nickName}
                onChange={(e) => setNickName(e.target.value)}
              />
            </div>
            <div className="room_setting_content_btns">
              <div className="room_setting_save_btn" onClick={roomNameClick}>Save</div>
            </div>
          </div>
        </div>
			</div>
		</Styled>
  );
};

export default RoomSetting;
