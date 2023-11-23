import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./inviteRoomItem.css";
import { api } from "../../../api"; 
import { getInviteSendEvent, timeFormat } from "../../../utils/index";
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
  const [senderEvent, setSenderEvent] = useState()

  useEffect(() => {
    if (room) {
      const ship = room.getMyMembership();
      const members = room.getJoinedMembers();
      setMembership(ship);
      setMemberList(members);
      setSenderEvent(getInviteSendEvent(room))
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

  const getInviteSendUser = () => {
    const res = api._client.getUser(senderEvent?.event?.sender)
    console.error('getInviteSendUser: ', senderEvent, senderEvent?.event?.sender, res)
  }
  const getInviteSendTs = () => {
    return senderEvent?.event?.origin_server_ts
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
          <UserAvatar member={getInviteSendUser()} />
        </div>

        <div className="invite-item-right">
          <div className="invite-item-right-before">
            <div className="invite-item-right-before-name">{room.name || room.calculateName}</div>
            <div className="invite-item-right-before-time">{timeFormat(getInviteSendTs())}</div>
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
