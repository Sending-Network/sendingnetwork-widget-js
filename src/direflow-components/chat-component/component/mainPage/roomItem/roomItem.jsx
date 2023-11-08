import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomItem.css";
import { api } from "../../../api";
import { formatTextLength, timeFormat, formatUserName, getMsgStr } from "../../../utils/index";
import { Filter, SendingNetworkEvent } from "sendingnetwork-js-sdk";
import RoomAvatar from "../../roomAvatar/roomAvatar";

const RoomItem = ({ room, enterRoom }) => {
  const [memberList, setMemberList] = useState([]);
  const [membership, setMembership] = useState("");
  const [lastTime, setLastTime] = useState("");
  const [lastMsg, setLastMsg] = useState("");
  const [showAtMention, setShowAtMention] = useState(false);
  const myUserId = api.getUserId();

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
  }, [room.notificationCounts.total]);

  useEffect(() => {
    getLastEventMsg(room);
  }, [room?.getLiveTimeline()?.getEvents()?.length]);

  const atCheck = () => {
    const { displayname } = api.userData;
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();
    const evList = events.slice(events.length - room.notificationCounts.total);
    for (let i in evList) {
      const ev = evList[i].getContent();
      if (ev && ev.body) {
        if (
          (ev.format === 'org.sdn.custom.html' || ev.format === 'org.matrix.custom.html') &&
          ev.body.indexOf('@' + displayname) !== -1
        ) {
          setShowAtMention(true);
          return;
          // } else if (ev.body.indexOf('@room') !== -1) {
          //   setShowAtMention(true);
          //   return;
        }
      }
    }
    setShowAtMention(false);
  }

  const getLastEventMsg = (room) => {
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();
    const isDmRoom = room.isDmRoom();
    const userId = api.getUserId();
    const deletedIdMap = {};
    if (events.length) {
      let lastEvent, timeStr, msgStr;
      for (let i = events.length - 1; i >= 0; i--) {
        lastEvent = events[i];
        
        if (!lastEvent || !lastEvent.event) continue
        if (lastEvent.getType() === 'm.room.redaction' && lastEvent.event.redacts) {
          deletedIdMap[lastEvent.event.redacts] = 1;
          continue;
        } else if (deletedIdMap[lastEvent.getId()] > 0) {
          continue;
        } else if (lastEvent.event.content && lastEvent.event.content['m.relates_to']) {
          const {event_id, rel_type} = lastEvent.event.content['m.relates_to'];
          if (rel_type === 'm.replace' && deletedIdMap[event_id] > 0) {
            continue;
          }
        }
        msgStr = getMsgStr(lastEvent, isDmRoom, userId);
        if (msgStr) {
          timeStr = timeFormat(lastEvent.getTs());
          break;
        }
      }
      if (msgStr) {
        setLastTime(timeStr);
        setLastMsg(msgStr);
      }
    }
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

  return (room && room.type !== 'm.space' ?
    <Styled styles={styles}>
      <div
        className="room-item"
        key={room.roomId}
        onClick={() => membership === "join" && enterRoom(room.roomId)}
      >
        <div className="room-item-left">
          {<RoomAvatar room={room}/>}
        </div>

        <div className="room-item-right">
          <div className="room-item-right-top">
            <div className="room-item-right-top-name">{room.name || room.calculateName}</div>
            <div className="room-item-right-top-time">{lastTime}</div>
          </div>
          <div className="room-item-right-bottom">
            {membership === "join" && (
              <div className="room-item-right-bottom-msg">
                {lastMsg}
              </div>
            )}
            {membership === "join" && showAtMention && (
              <div className="room-item-right-bottom-badge">@</div>
            )}
            {membership === "join" && room.notificationCounts.total > 0 && (
              <div className="room-item-right-bottom-badge">{room.notificationCounts.total}</div>
            )}
            {membership === "invite" && (
              <div className="room-item-right-bottom-invites">
                <div className="room-item-invite-btns" onClick={() => accept(room.roomId)} >Accept</div>
                <div className="room-item-invite-btns" onClick={() => reject(room.roomId)} >Reject</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Styled> : null
  );
};

export default RoomItem;
