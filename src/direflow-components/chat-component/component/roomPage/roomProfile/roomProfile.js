import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomProfile.css";
import { api } from "../../../api";
import {
	roomTitleBackIcon,
	morePagePersonIcon,
	roomProfileInviteIcon,
	roomProfileSetIcon
} from "../../../imgs/index";
import RoomSetting from "./roomSetting/roomSetting";
import { AvatarComp } from "../../avatarComp/avatarComp";
import { formatTextLength, calculateRoomName } from "../../../utils/index";

const RoomProfile = ({ room = {}, backClick }) => {
	const [showSetting, setShowSetting] = useState(false);
	const [roomName, setRoomName] = useState("");
	const [joinedMembers, setJoinedMembers] = useState([]);

	useEffect(() => {
		const members = room.getJoinedMembers();
		const tmpName = calculateRoomName(room, true);
		setRoomName(tmpName);
		setJoinedMembers(members);
	}, [])

	const handleBackClick = () => {
		showSetting ? setShowSetting(false) : backClick()
	}

	const handleSettingLeave = async () => {
		await api.leave(room.roomId);
		backClick('leaved');
	}

  return (
    <Styled styles={styles}>
      <div className="room_profile">
				{/* title */}
				<div className="room_profile_title">
					<div className="title_back" onClick={() => handleBackClick()}>
						<img src={roomTitleBackIcon} />
					</div>
					{showSetting && <span className="title_back_setting">Room Settings</span>}
				</div>

				{showSetting ? (
						<RoomSetting
							room={room}
							onLeave={handleSettingLeave}
							refreshRoomName={(text) => setRoomName(text)}
						/>
				) : (
					<div className="room_profile_wrap">
						{/* info */}
						<div className="room_profile_info">
							<div className="info_img_box">
								<img src={morePagePersonIcon} />
							</div>
							<div className="info_room_title">{formatTextLength(roomName, 30, 15)}</div>
							<div className="info_room_roomId">{formatTextLength(room.roomId, 30, 15)}</div>
						</div>
						{/* btns */}
						<div className="info_room_btns">
							<div className="info_room_btns-item info_room_btns-item-invite" onClick={() => backClick('invite')}>
								<img src={roomProfileInviteIcon} />
								<span>Invite</span>
							</div>
							<div className="info_room_btns-item info_room_btns-item-setting" onClick={() => setShowSetting(true)}>
								<img src={roomProfileSetIcon} />
								<span>Setting</span>
							</div>
						</div>
						{/* members */}
						<div className="room_members">
							{joinedMembers.map(member => {
								return (
									<div className="room_members_item" key={member.userId}>
										<div className="room_members_item_avatar">
											<AvatarComp url={member?.user?.avatarUrl}/>
										</div>
										<div className="room_members_item_desc">
											<p className="room_members_item_desc_name">{member.name}</p>
											<p className="room_members_item_desc_addr">{member.userId}</p>
										</div>
									</div>
								)
							})}
						</div>

					</div>
				)}
			</div>
		</Styled>
  );
};

export default RoomProfile;
