import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomProfile.css";
import { api } from "../../../api";
import {
	roomTitleBackIcon,
	roomProfileInviteIcon,
	roomProfileSetIcon
} from "../../../imgs/index";
import RoomSetting from "./roomSetting/roomSetting";
import { AvatarComp, AvatarMutiComp } from "../../avatarComp/avatarComp";
import { formatTextLength, calculateRoomName, getAddressByUserId } from "../../../utils/index";

const RoomProfile = ({ room = {}, isDMRoom, backClick }) => {
	const [memberCollapse, setMemberCollapse] = useState(false);
	const [showSetting, setShowSetting] = useState(false);
	const [showDialog, setShowDialog] = useState(false)
	const [roomName, setRoomName] = useState("");
	const [joinedMembers, setJoinedMembers] = useState([]);

	useEffect(() => {
		const members = room?.getJoinedMembers ? room?.getJoinedMembers() : [];
		const tmpName = room?.name ? calculateRoomName(room, true) : '';
		setJoinedMembers(members);
		setRoomName(tmpName);
	}, [room])

	const handleBackClick = () => {
		showSetting ? setShowSetting(false) : backClick()
	}

	const handleSettingLeave = async () => {
		await api.leave(room?.roomId);
		backClick('leaved');
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
							openLeaveDialog={() => setShowDialog(true)}
							refreshRoomName={(text) => setRoomName(text)}
						/>
				) : (
					<div className="room_profile_wrap">
						{/* info */}
						<div className="room_profile_info">
							<div className="info_img_box">
								{renderAvatar()}
							</div>
							<div className="info_room_title">{formatTextLength(roomName, 30, 15)}</div>
							<div className="info_room_roomId">{formatTextLength(room?.roomId, 30, 15)}</div>
						</div>
						{/* btns */}
						{!isDMRoom && (
							<div className="info_room_btns">
								<div className="info_room_btns-item info_room_btns-item-invite" onClick={() => backClick('invite')}>
									<span>Invite</span>
								</div>
								<div className="info_room_btns-item info_room_btns-item-setting" onClick={() => setShowSetting(true)}>
									<span>Settings</span>
								</div>
							</div>
						)}
						{/* members */}
						<div className="room_members">
							<div>
								<p className="room_members_title">
									<span>Room Members</span>
									<span
										className={["room_members_title_icon", memberCollapse ? "icon_top" : "icon_bottom" ].join(" ")}
										onClick={() => setMemberCollapse(!memberCollapse)}
									></span>
								</p>
								{!memberCollapse && joinedMembers.map(member => {
									const addr = getAddressByUserId(member.userId)
									return (
										<div className="room_members_item" key={member.userId}>
											<div className="room_members_item_avatar">
												<AvatarComp url={member?.user?.avatarUrl}/>
											</div>
											<div className="room_members_item_desc">
												<p className="room_members_item_desc_name">{member?.name}</p>
												<p className="room_members_item_desc_addr">{addr}</p>
											</div>
										</div>
									)
								})}
							</div>
							{isDMRoom && (
								<div className="room_profile_leave" onClick={() => setShowDialog(true)}>Leave Room</div>
							)}
						</div>
					</div>
				)}

				{/* leave dialog */}
				{showDialog && (
          <div className="room_profile_dialog">
            <div className="room_profile_dialog_content">
              <div className="info">
                <p className="info-title">Leave Room</p>
                <p className="info-desc">Are you certain about leaving the room?</p>
              </div>
              <div className="btns">
                <div className="btns-item btns-cancel" onClick={() => setShowDialog(false)}>Cancel</div>
                <div className="btns-item btns-confirm" onClick={() => handleSettingLeave()}>Leave</div>
              </div>
            </div>
          </div>
        )}
			</div>
		</Styled>
  );
};

export default RoomProfile;
