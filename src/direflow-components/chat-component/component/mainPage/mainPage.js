import React, { useEffect, useMemo, useRef, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./mainPage.css";
import ListTitle from './listTitle/listTitle'
import RoomList from './roomList/roomList.js'
import { calculateRoomName } from "../../utils/index";

const MainPage = ({ rooms, goToRoom, onMenuClick }) => {
	const [closeModalms, setCloseModalms] = useState('');
	const [roomList, setRoomList] = useState(rooms);

	useEffect(() => {
		initRoomList(rooms);
	}, [rooms])

	const initRoomList = async (list) => {
		const resultList = [];
		for (let i = 0; i < list.length; i++) {
			const m = list[i];
			m.calculateName = handleRoomName(m);
			if (m.calculateName !== 'Empty Room') {
				resultList.push(m);
			}
		}
		setRoomList(resultList);
	}

	const handleRoomName = (room) => {
		let result = "";
		const ship = room.getMyMembership()
		if (ship === 'join') {
			result = calculateRoomName(room);
		} else if (ship === 'invite') {
			const { name, roomId } = room;
			result = name;
			if (/^@sdn_/.test(name)) {
				const inviterId = roomId.split('-')[1];
				result = inviterId || name;
			}
		}
		return result;
	}

  return (
		<Styled styles={styles}>
			<div className="chat_widget_main_page" onClick={() => { setCloseModalms(new Date().getTime()) }}>
				<ListTitle closeModalms={closeModalms} menuClick={onMenuClick} />
				<RoomList rooms={roomList} enterRoom={(roomId) => goToRoom(roomId)} />
			</div>
		</Styled>
  );
};

export default MainPage;
