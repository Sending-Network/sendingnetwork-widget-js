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
import { formatTextLength, calculateRoomName, calculateRoomTopic, calculateRemark, calculateNickName, getAddressByUserId, getMemberName, formatUserName } from "../../../utils/index";
import RoomMenu from "./roomMenu/roomMenu";
import UserAvatar from "../../userAvatar/userAvatar";

const RoomProfile = ({ room = {}, isDMRoom, backClick, memberClick, onLeave }) => {
  const [memberCollapse, setMemberCollapse] = useState(false);
  const [inviteCollapse, setInviteCollapse] = useState(false); // whether collapse invited member list
  const [showSetting, setShowSetting] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomTopic, setRoomTopic] = useState("");
  const [remark, setRemark] = useState("");
  const [nickName, setNickName] = useState("");
  const [joinedMembers, setJoinedMembers] = useState([]);
  const [invitedMembers, setInvitedMembers] = useState([]); // invited members list
  const [meMember, setMeMember] = useState(null);
  const [searchList, setSearchList] = useState(null);
  const [filterStr, setFilterStr] = useState("");
  const [closeModalms, setCloseModalms] = useState('');
  const [powerUsers, setPowerUsers] = useState({});
  const [roleUsers, setRoleUsers] = useState({});
  const [roomVersion, setRoomVersion] = useState(0);

  useEffect(() => {
    if (room && room.roomId) {
      const members = room.getJoinedMembers();
      console.log('joined ' + members.length, members);
      const version = Number(room.getVersion()) || 0;
      const squad = room.hasSpaceParent() ? room.getParentRoom() : room;
      let powerLevelEvent;
      if (version < 100) {
        powerLevelEvent = room.currentState.getStateEvents("m.room.power_levels", "");
      } else {
        powerLevelEvent = squad.currentState.getStateEvents("m.room.power_levels", "");
      }
      if (powerLevelEvent) {
        const levelContent = powerLevelEvent.getContent();
        if (version <= 10) {
          const { users } = levelContent;
          setPowerUsers(users);
        } else {
          const { role_bindings, roles } = levelContent;
          const roleMap = {};
          if (roles && roles.length) {
            for (let i = 0; i < roles.length; i++) {
              roleMap[roles[i].id] = roles[i];
            }
          }
          const tagMap = {};
          for (let key in role_bindings) {
            const arr = role_bindings[key];
            if (roleMap[key]) {
              for (let i = 0; i < arr.length; i++) {
                tagMap[arr[i]] = roleMap[key];
              }
            } else if (key === 'Owner') {
              tagMap[arr[0]] = {
                name: key
              }
            } else if (key === 'SA') {
              tagMap[arr[0]] = {
                name: 'Admin'
              }
            }
          }
          setRoleUsers(tagMap);
        }
      }
      const invited = room.getMembersWithMembership("invite");
      const tmpName = calculateRoomName(room, true);
      const tmpTopic = calculateRoomTopic(room)
      const tmpRemark = calculateRemark(room);
      const tmpNickName = calculateNickName(room);
      const me = api.getUserId();
      const meMember = room.getMember(me);
      setRoomVersion(room.getVersion());
      setMeMember(meMember);
      setJoinedMembers(members);
      setInvitedMembers(invited);
      setRoomName(tmpName);
      setRoomTopic(tmpTopic);
      setRemark(tmpRemark);
      setNickName(tmpNickName);
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

  const handleBackClick = () => { // click top left corner room Profile back btn
    showSetting ? setShowSetting(false) : backClick()
  }

  const onClickMember = (member) => { // click Room Members item or invited item
    memberClick(member.userId);
  }

  const getMemberTag = (member) => {
    if (room && room.isDmRoom()) return null
    if (roomVersion <= 10) {
      const level = powerUsers[member.userId];
      if (level) {
        let str = '';
        if (level == '100') {
          str = 'Admin';
        } else if (level == '50') {
          str = 'Mod'
        }
        return <span className={"room_member_tag " + str.toLowerCase()}>{str}</span>
      }
    } else {
      const role = roleUsers[member.userId];
      if (role) {
        const styles = {};
        const { color, name } = role;
        if (color) {
          styles.color = color;
        }
        return <span className={"room_member_tag " + name.toLowerCase()} style={styles}>{name}</span>
      }
    }
    return null
  }

  const getMemberItem = (member) => {
    if (member && member.userId) {
      const addr = getAddressByUserId(member.userId)
      return <div className="room_members_item" key={member.userId} onClick={() => { onClickMember(member) }}>
        <div className="room_members_item_avatar">
          <UserAvatar member={member} />
        </div>
        <div className="room_members_item_desc">
          <p className="room_members_item_desc_name">
            <span className="room_member_name">{getMemberName(member)}</span>
            {getMemberTag(member)}
          </p>
          <p className="room_members_item_desc_addr">{addr}</p>
        </div>
      </div>
    }
    return null
  }

  return (
    <Styled styles={styles}>
      <div className="room_profile" onClick={() => { setCloseModalms(new Date().getTime()) }}>
        {/* title */}
        <div className="room_profile_title">
          <div className="title_back svg-btn svg-btn-stroke" onClick={() => handleBackClick()}>
            {backIcon}
          </div>
          <div className="title_back_content">{showSetting ? 'Room Settings' : 'Room Profile'}</div>
          <div className="room_title_right">
            <RoomMenu room={room} onLeave={onLeave} closeModalms={closeModalms} />
          </div>
        </div>

        {showSetting ? (
          <RoomSetting
            room={room}
            roomName={roomName}
            joinedMembers={joinedMembers}
            refreshRoomName={(text) => setRoomName(text)}
            refreshRoomTopic={(text) => setRoomTopic(text)}
            refreshRemark={(text) => setRemark(text)}
            refreshNickName={(text) => setNickName(text)}
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
      </div>
    </Styled>
  );
};

export default RoomProfile;
