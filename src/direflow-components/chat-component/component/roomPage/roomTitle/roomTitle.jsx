import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomTitle.css";
import { backIcon, moreIcon } from "../../../imgs/svgs";
import { calculateRoomName, formatTextLastElide } from "../../../utils/index";

const RoomTitle = ({ room, onBack, setClick }) => {
	const [curRoom, setCurRoom] = useState(null);
	const [curRoomName, setCurRoomName] = useState("");

	useEffect(() => {
		if (room) {
      room.on("Room.name", onRoomName);
			setCurRoom(room);
		}
    return (() => {
      if (room) {
        room.off("Room.name", onRoomName);
      }
    })
	}, [room]);

  useEffect(() => {
    if (room && room.name) {
      if (room.name === 'Empty room') return
      if (room.isDmRoom()) {
        setCurRoomName(room.name);
      } else {
        const allMembers = room.getMembers();
        const tmpName = `${room.name} (${allMembers.length})`
        setCurRoomName(tmpName);
      }
    }
  }, [room, room?.name])

  const onRoomName = (target) => {
    setCurRoom(target.name);
  }

  return (
    <Styled styles={styles}>
      <div className="roomPage_room_title">
				<div className="svg-btn svg-btn-stroke room_title_left" onClick={() => onBack()}>
					{backIcon}
				</div>
				<div className="room_title_center">{curRoomName}</div>
				<div className="svg-btn svg-btn-fill room_title_right" onClick={() => setClick()}>
					{moreIcon}
				</div>
			</div>
		</Styled>
  );
};

export default RoomTitle;
