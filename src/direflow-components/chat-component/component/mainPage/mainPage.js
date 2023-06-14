import React, { useEffect, useMemo, useRef, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./mainPage.css";
import ListTitle from './listTitle/listTitle'
import RoomList from './roomList/roomList.js'
import { api } from "./../../api";

const MainPage = ({ rooms, goToRoom, onMenuClick }) => {
	const [closeModalms, setCloseModalms] = useState('');
	const [roomList, setRoomList] = useState(rooms);
	const [myUserData, setMyUserData] = useState({});

	useEffect(() => {
		setRoomList(rooms);
		initUserData();
	}, [rooms])

	const initUserData = async () => {
		const res = await api.getUserData();
		setMyUserData(res);
	}

  return (
		<Styled styles={styles}>
			<div className="chat_widget_main_page" onClick={() => { setCloseModalms(new Date().getTime()) }}>
				<ListTitle closeModalms={closeModalms} menuClick={onMenuClick} />
				<RoomList rooms={roomList} myUserData={myUserData} enterRoom={(roomId) => goToRoom(roomId)} />
			</div>
		</Styled>
  );
};

export default MainPage;
