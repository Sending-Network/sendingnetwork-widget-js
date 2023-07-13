import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomItem.css";
import { api } from "../../../api";
import { formatTextLength } from "../../../utils/index";
import { AvatarMutiComp, AvatarComp } from "../../avatarComp/avatarComp";

const RoomItem = ({ room, enterRoom }) => {
	const [memberList, setMemberList] = useState([]);
	const [membership, setMembership] = useState("");
	const [lastTime, setLastTime] = useState("");
	const [lastMsg, setLastMsg] = useState("");
	const [showAtMention, setShowAtMention] = useState(false);

	useEffect(() => {
		if (room) {
			const ship = room.getMyMembership();
			const members = room.getJoinedMembers();
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
		const { displayname } = api.userData;
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
					case 'm.image': msgStr = '[Image]';
						break;
					case 'm.file': msgStr = '[File]';
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
		text = `${h < 10 ? ('0' + h) : h}:${m < 10 ? ('0' + m) : m}`
		return text
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
		if (memberList.length === 2) {
			const list = memberList.filter(v => v.userId !== api.getUserId())
			const anotherUser = list[0] || {};
			return <AvatarComp url={anotherUser?.user?.avatarUrl} />
		} else if (memberList.length >= 3) {
			const urls = [];
			memberList.map(m => {
				if (m && m.user && m.user.avatarUrl) {
					urls.push(m.user.avatarUrl)
				}
			})
			const fillArr = new Array(memberList.length - urls.length).fill(null);
			urls.push(...fillArr)
			return <AvatarMutiComp urls={urls} />
		} else {
			return <AvatarComp />
		}
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
						<p className="room-item-roomName">{formatTextLength(room?.calculateName, 30, 10)}</p>
						{showAtMention ? (
							<p className="room-item-msg-at">@ You're mentioned</p>
						) : (
							<p className="room-item-msg">{lastMsg}</p>
						)}
					</div>
				)}
				{membership === "invite" && (
					<div className="room-item-center">
						<p className="room-item-roomName">{formatTextLength(room?.calculateName, 30, 10)}</p>
						<div className="room-item-invite">
							<div className="room-item-invite-btns" onClick={() => accept(room.roomId)} >Accept</div>
							<div className="room-item-invite-btns" onClick={() => reject(room.roomId)} >Reject</div>
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
