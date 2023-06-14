import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomTitle.css";
import { roomTitleBackIcon, roomTitleMoreIcon } from "../../../imgs/index";
import { calculateRoomName } from "../../../utils/index";

const RoomTitle = ({ room, onBack, setClick }) => {
	const [curRoom, setCurRoom] = useState(null);
	const [curRoomName, setCurRoomName] = useState("");

	useEffect(() => {
		if (room) {
			setCurRoom(room);
			const tmpName = calculateRoomName(room, true);
			setCurRoomName(tmpName);
		}
	}, [room])

  return (
    <Styled styles={styles}>
      <div className="roomPage_room_title">
				<div className="room_title_left" onClick={() => onBack()}>
					<img src={roomTitleBackIcon} />
				</div>
				<div className="room_title_center">{curRoomName}</div>
				<div className="room_title_right" onClick={() => setClick()}>
					<img src={roomTitleMoreIcon} />
				</div>
			</div>
		</Styled>
  );
};

export default RoomTitle;
