import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomProfile.css";
import { api } from "../../../api";
import {
  setPageAvatarBg,
  searchInputIcon
} from "../../../imgs/index";
import { inviteIcon, settingIcon, backIcon, } from "../../../imgs/svgs";
import RoomSetting from "./roomSetting/roomSetting";
import RoomAvatar from "../../roomAvatar/roomAvatar";
import { formatTextLength, calculateRoomName, getAddressByUserId, getMemberName, formatUserName } from "../../../utils/index";
import RoomMenu from "./roomMenu/roomMenu";
import UserAvatar from "../../userAvatar/userAvatar";

const RoomProfile = ({ room = {}, isDMRoom, backClick, memberClick, onLeave }) => {
  const [memberCollapse, setMemberCollapse] = useState(false);
  const [inviteCollapse, setInviteCollapse] = useState(false);
  const [showSetting, setShowSetting] = useState(false);
  const [showDialog, setShowDialog] = useState(false)
  const [roomName, setRoomName] = useState("");
  const [joinedMembers, setJoinedMembers] = useState([]);
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [meMember, setMeMember] = useState(null);
  const [searchList, setSearchList] = useState(null);
  const [filterStr, setFilterStr] = useState("");
  const [closeModalms, setCloseModalms] = useState('');

  useEffect(() => {
    if (room && room.roomId) {
      const members = room.getJoinedMembers();
      console.log('joined ' + members.length, members);
      const invited = room.getMembersWithMembership("invite");
      // console.log('invite ' + invited.length, invited);
      const tmpName = calculateRoomName(room, true);
      const me = api.getUserId();
      const meMember = room.getMember(me);
      setMeMember(meMember);
      setJoinedMembers(members);
      setInvitedMembers(invited);
      setRoomName(tmpName);
    }
  }, [room])

  useEffect(() => {
    if (filterStr && joinedMembers) {
      let arr = [];
      let filter = filterStr.toLowerCase();
      joinedMembers.forEach(member => {
        if (member && (member.name.toLowerCase()).indexOf(filter) > -1) {
          arr.push(member);
        }
      });
      setSearchList(arr);
    } else {
      setSearchList(null);
    }
  }, [filterStr, joinedMembers]);

  const handleBackClick = () => {
    showSetting ? setShowSetting(false) : backClick()
  }

  const handleSettingLeave = async () => {
    await api.leave(room?.roomId);
    backClick('leaved');
  }

  const onClickMember = (member) => {
    memberClick(member.userId);
  }

  const getMemberItem = (member) => {
    if (member && member.userId) {
      const addr = getAddressByUserId(member.userId)
      return <div className="room_members_item" key={member.userId} onClick={() => { onClickMember(member) }}>
          <div className="room_members_item_avatar">
          <UserAvatar member={member} />
          </div>
          <div className="room_members_item_desc">
            <p className="room_members_item_desc_name">{formatUserName(getMemberName(member))}</p>
            <p className="room_members_item_desc_addr">{addr}</p>
          </div>
        </div>
    }
    return null
  }

  return (
    <Styled styles={styles}>
      <div className="room_profile" onClick={()=>{setCloseModalms(new Date().getTime())}}>
        {/* title */}
        <div className="room_profile_title">
          <div className="title_back svg-btn svg-btn-stroke" onClick={() => handleBackClick()}>
            {backIcon}
          </div>
          <div className="title_back_content">{showSetting ? 'Room Settings' : 'Room Profile'}</div>
          <div className="room_title_right">
            <RoomMenu room={room} onLeave={onLeave} closeModalms={closeModalms}/>
          </div>
        </div>

        {showSetting ? (
          <RoomSetting
            room={room}
            roomName={roomName}
            joinedMembers={joinedMembers}
            openLeaveDialog={() => setShowDialog(true)}
            refreshRoomName={(text) => setRoomName(text)}
          />
        ) : (
          <div className="room_profile_wrap">
            {/* info */}
            <div className="room_profile_info" style={{ backgroundImage: `url(${setPageAvatarBg})` }}>
              <div className="info_img_box">
                {(room && room.roomId) ? <RoomAvatar room={room} /> : null}
              </div>
              <div className="info_room_title">{roomName}</div>
              <div className="info_room_roomId">{formatTextLength(room?.roomId, 30, 15)}</div>
              <div className="info_room_station_box"></div>
            </div>
            {/* btns */}
            {!isDMRoom && (
              <div className="info_room_btns">
                <div
                  className="info_room_btns-item info_room_btns-item-invite"
                  style={{ width: meMember && meMember.powerLevel >= 100 ? 'calc(50% - 8px)' : '100%' }}
                  onClick={() => backClick('invite')}
                >
                  {inviteIcon}
                  <span>Invite</span>
                </div>
                {meMember && meMember.powerLevel >= 100 && (
                  <div className="info_room_btns-item info_room_btns-item-setting" onClick={() => setShowSetting(true)}>
                    {settingIcon}
                    <span>Settings</span>
                  </div>
                )}
              </div>
            )}
            {!isDMRoom && (<div className="room-profile-search">
              <div className="search-bar">
                <img className="search-icon" src={searchInputIcon} />
                <input
                  className="filter-box"
                  placeholder="Search"
                  value={filterStr}
                  onChange={(e) => setFilterStr(e.target.value)}
                />
              </div>
            </div>)}
            {/* members */}
            <div className="room_members">
              <div>
                <p className="room_members_title" onClick={() => setMemberCollapse(!memberCollapse)}>
                  <span>Room Members</span>
                  <span
                    className={["room_members_title_icon", memberCollapse ? "icon_top" : "icon_bottom"].join(" ")}
                  ></span>
                </p>
                {!memberCollapse && (searchList || joinedMembers).map(member => {
                  return getMemberItem(member);
                })}
              </div>
            </div>
            {invitedMembers.length ? <div className="room_members">
              <div>
                <p className="room_members_title" onClick={() => setInviteCollapse(!inviteCollapse)}>
                  <span>Invited</span>
                  <span
                    className={["room_members_title_icon", inviteCollapse ? "icon_top" : "icon_bottom"].join(" ")}
                  ></span>
                </p>
                {!inviteCollapse && (invitedMembers).map(member => {
                  return getMemberItem(member);
                })}
              </div>
            </div> : null}
          </div>
        )}

        {/* leave dialog */}
        {showDialog && (
          <div className="room_profile_dialog">
            <div className="room_profile_dialog_content">
              <div className="info">
                Are you certain about<br />leaving the room?
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
