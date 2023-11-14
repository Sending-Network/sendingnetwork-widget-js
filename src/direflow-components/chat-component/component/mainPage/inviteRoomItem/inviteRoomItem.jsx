import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./inviteRoomItem.css";
import { api } from "../../../api"; 
import { formatTextLength, timeFormat, formatUserName, getMsgStr, getDefaultAvatar } from "../../../utils/index";
import { Filter, SendingNetworkEvent } from "sendingnetwork-js-sdk";
import RoomAvatar from "../../roomAvatar/roomAvatar";
import UserAvatar from "../../userAvatar/userAvatar";
import { checkIcon, circleIcon } from "../../../imgs/svgs";

const RoomItem = ({ room, isEditing, onCheckChanged, acceptInvite, rejectInvite}) => {
  const [checked, setChecked] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [membership, setMembership] = useState("");
  const [lastTime, setLastTime] = useState("");
  const [lastMsg, setLastMsg] = useState("");
  const [timestamp, setTimestamp] = useState(0);
  const [inviteSender, setInviteSender] = useState(null)

  useEffect(() => {
    if (room) {
      const ship = room.getMyMembership();
      const members = room.getJoinedMembers();
      setMembership(ship);
      setMemberList(members);
      setInviteSender(getInviteSendUser(room))
      room.on("Room.timeline", onTimeline);
    }
    return (() => {
      room.off("Room.timeline", onTimeline);
    })
  }, [room]);

  useEffect(() => {
    if (room) {
      setChecked(room.checked)
    }
  }, [room?.checked])

  const getInviteSendUser = (room) => {
    const userId = api.getUserId()
    const senderEvent = room.currentState?.members[userId]?.events?.member // send invite event(SendingNetworkEvent)
    return api._client.getUser(senderEvent?.event?.sender)
  }

  const onTimeline = (sdnEvent) => {
    setTimestamp(sdnEvent.getTs() || Date.now());
  }

  const handleClick = (e) => { // click to select or cancel one invitation
    if (isEditing) {
      const next = !room.checked;
      room.checked = next;
      onCheckChanged(room, next);
    }
    console.log(room);
  }

  return (room && room.type !== 'm.space' ?
    <Styled styles={styles}>
      <div
        className="invite-item"
        key={room.roomId}
        onClick={handleClick}
      >
        {isEditing ? <div className="invite-checkbox">
          {checked ? checkIcon : circleIcon}
        </div> : null}
        <div className="invite-item-left">
          <UserAvatar member={inviteSender} />
        </div>

        <div className="invite-item-right">
          <div className="invite-item-right-before">
            <div className="invite-item-right-before-name">{room.name || room.calculateName}</div>
            <div className="invite-item-right-before-time">{timestamp || ''}</div>
          </div>
          <div className="invite-item-right-after">
            {!isEditing && membership === "invite" && (
              <div className="invite-item-right-after-invites">
                <div className="invite-item-after-invite-btns" onClick={() => rejectInvite(room.roomId)} >Reject</div>
                <div className="invite-item-after-invite-btns accept" onClick={() => acceptInvite(room.roomId)} >Accept</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Styled> : null
  );
};

export default RoomItem;
