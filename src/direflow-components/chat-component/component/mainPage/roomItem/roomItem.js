import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomItem.css";
import { api } from "../../../api";
import { formatTextLength, calculateRoomName } from "../../../utils/index";
import { AvatarMutiComp, AvatarComp } from "../../avatarComp/avatarComp";

const RoomItem = ({ room, enterRoom, myUserData }) => {
	const [memberList, setMemberList] = useState([]);
	const [membership, setMembership] = useState("");
	const [lastTime, setLastTime] = useState("");
	const [lastMsg, setLastMsg] = useState("");
	const [roomName, setRoomName] = useState("");
	const [showAtMention, setShowAtMention] = useState(false);

	useEffect(() => {
		if (room) {
			const ship = room.getMyMembership();
			const members = room.getJoinedMembers();
			handleJoinedRoomName(ship, members, room)
			setMembership(ship)
			getLastEventMsg(room)
			setMemberList(members)
		}
	}, [room])

	useEffect(() => {
		atCheck();
		getLastEventMsg(room);
	}, [room.notificationCounts.total])

	const atCheck = () => {
		const { displayname } = myUserData;
		const timeline = room.getLiveTimeline();
		const events = timeline.getEvents();
		const evList = events.slice(events.length - room.notificationCounts.total);
		for (let i in evList) {
			const ev = evList[i].getContent();
			if (
				ev &&
				ev.format === 'org.sdn.custom.html' &&
				ev.body &&
				ev.body.indexOf('@'+displayname) !== -1
			) {
				setShowAtMention(true);
				return;
			}
		}
		setShowAtMention(false);
	}

	const getLastEventMsg = (room) => {
		const timeline = room.getLiveTimeline();
		const events = timeline.getEvents();
		if (events.length) {
			const lastEvent = events[events.length - 1];
			const content = lastEvent.getContent();
			const timeStr = formatTime(lastEvent.getTs());
			let msgStr = ""
			if (lastEvent.getType() === 'm.room.message' && content) {
				switch (content.msgtype) {
					case 'm.text': msgStr = content.body;
						break;
					case 'm.image': msgStr = '[picture]';
						break;
					case 'm.file': msgStr = '[file]';
						break;
				}
			}
			setLastTime(timeStr);
			setLastMsg(msgStr);
		}
	}

	const formatTime = (time) => {
		if (!time) return "";
		let text = "";
		const date = new Date(time);
		const m = date.getMinutes().toString();
		let h = date.getHours().toString();
		let flag = 'AM';
		if (h > 12) {
			h = h - 12;
			flag = 'PM'
		}
		text = `${h < 10 ? ('0' + h) : h}:${m < 10 ? ('0' + m) : m} ${flag}`
		return text
	}

	const handleJoinedRoomName = (tmpShip, tmpMembers, tmpRoom) => {
		let result = "";
		if (tmpShip === 'join') {
			result = calculateRoomName(room);
		} else if (tmpShip === 'invite') {
			const { name, roomId } = tmpRoom;
			result = name;
			if (/^@sdn_/.test(name)) {
				const inviterId = roomId.split('-')[1];
				result = inviterId || name;
			}
		}
		setRoomName(result);
	}

	const accept = (roomId) => {
    api.joinRoom(roomId, () => {
			setMembership('join')
		});
  };

  const reject = (roomId) => {
    api.leave(roomId, () => {
			setMembership('leave')
		});
  };

	const renderAvatar = () => {
		// if (memberList.length >= 3) {
		// 	// const arr = memberList.map
		// 	console.log('widget---=', memberList)
		// 	return <AvatarMutiComp />
		// } else {
		// 	return <AvatarComp />
		// }
		return <AvatarComp />
	}

  return (
    <Styled styles={styles}>
			<div
				className="room-item"
				key={room.roomId}
				onClick={() => membership === "join" && enterRoom(room.roomId)}
			>
				<div className="room-item-left">
					{renderAvatar()}
				</div>
				{membership === "join" && (
					<div className="room-item-center">
						<p className="room-item-roomName">{formatTextLength(roomName, 30, 10)}</p>
						{showAtMention ? (
							<p className="room-item-msg-at">@ You're mentioned</p>
						) : (
							<p className="room-item-msg">{lastMsg}</p>
						)}
					</div>
				)}
				{membership === "invite" && (
					<div className="room-item-center">
						<p className="room-item-roomName">{formatTextLength(roomName, 30, 10)}</p>
						<div className="room-item-invite">
							<div className="room-item-invite-btns" onClick={() => accept(room.roomId)} >accept</div>
							<div className="room-item-invite-btns" onClick={() => reject(room.roomId)} >reject</div>
						</div>
					</div>
				)}
				<div className="room-item-right">
					<p className="room-item-right-time">{lastTime}</p>
					{room.notificationCounts.total > 0 && (
						<div className="room-item-right-bage">{room.notificationCounts.total}</div>
					)}
				</div>
			</div>
		</Styled>
  );
};

export default RoomItem;
