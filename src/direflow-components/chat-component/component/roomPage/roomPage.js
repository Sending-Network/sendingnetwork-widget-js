import React, { useEffect, useState, useTransition } from "react";
import { Styled } from "direflow-component";
import styles from "./roomPage.css";
import RoomTitle from "./roomTitle/roomTitle";
import RoomView from "./roomView/roomView";
import RoomProfile from "./roomProfile/roomProfile";
import PinnedMsgCard from "./pinnedMsgCard/pinnedMsgCard";
import InvitePage from "../invitePage/invitePage";
import MemberProfile from "./memberProfile/memberProfile";
import { api } from "../../api";


const RoomPage = ({ roomId, callback }) => {
  const [curRoomId, setCurRoomId] = useState("");
  const [curRoom, setCurRoom] = useState(null);
  const [showUrlPreviewWidget, setShowUrlPreviewWidget] = useState(false);
  const [urlPreviewWidgetUrl, setUrlPreviewWidgetUrl] = useState("");
  const [showType, setShowType] = useState('room');
  const [pinnedIds, setPinnedIds] = useState([]);
  const [memberProfileId, setMemberProfileId] = useState("");

  useEffect(() => {
    if (roomId && roomId !== curRoomId) {
      setCurRoomId(roomId);
      initRoomData(roomId);
    }
  }, [])

  const initRoomData = () => {
    const room = api._client.getRoom(roomId);
    if (room) {
      const events = room.getLiveTimeline().getEvents();
      if (events.length) {
        api._client.sendReadReceipt(events[events.length - 1]);
      }
      initPinnedEvent(room)
      setCurRoom(room)
    }
  }

  const initPinnedEvent = (room) => {
    const pinnedList = room?.currentState?.getStateEvents("m.room.pinned_events", "")?.getContent().pinned || [];
    setPinnedIds(pinnedList)
  }

  const openUrlPreviewWidget = (url) => {
    setShowUrlPreviewWidget(true);
    setUrlPreviewWidgetUrl(url);
  };

  const onBack = () => {
    const room = api._client.getRoom(curRoomId);
    if (room) {
      const events = room.getLiveTimeline().getEvents();
      if (events.length) {
        api._client.sendReadReceipt(events[events.length - 1]);
      }
    }
    setCurRoomId("");
    setCurRoom(null);
    callback();
  }

  const handleProfileBack = (type) => {
    switch (type) {
      case 'leaved': onBack();
        break;
      case 'invite': setShowType('invite');
        break;
      default: setShowType('room');
        break;
    }
  }

  const pinnedCloseClick = async () => {
    await api._client.sendStateEvent(roomId, 'm.room.pinned_events', { pinned: [] }, "");
    setPinnedIds([]);
  }

  const pinClick = (msg, type) => {
    if (type === 'Pin') {
      const { event_id } = msg;
      setPinnedIds([event_id]);
    } else {
      setPinnedIds([])
    }
  }

  const pinEventSync = (eventData) => {
    const { content: { pinned } } = eventData;
    setPinnedIds(pinned);
  }

  const memberAvatarClick = (id) => {
    setMemberProfileId(id);
    setShowType('memberProfile');
  }

  return (
    <Styled styles={styles}>
      <div className="roomPage">
        {showType === 'profile' && <RoomProfile room={curRoom} backClick={handleProfileBack} />}
        {showType === 'invite' && <InvitePage roomId={curRoomId} onBack={() => setShowType('room')} />}
        {showType === 'memberProfile' && <MemberProfile memberId={memberProfileId} onBack={() => {
          setMemberProfileId("");
          setShowType('room');
        }} />}
        {showType === 'room' && (
          <div className="chat_widget_room_page">
            <RoomTitle room={curRoom} onBack={onBack} setClick={() => setShowType('profile')} />
            {pinnedIds.length > 0 && (
              <PinnedMsgCard
                roomId={roomId}
                pinnedIds={pinnedIds}
                pinnedCloseClick={pinnedCloseClick}
              />
            )}
            <RoomView
              roomId={roomId}
              pinnedIds={pinnedIds}
              openUrlPreviewWidget={openUrlPreviewWidget}
              pinClick={pinClick}
              pinEventSync={pinEventSync}
              memberAvatarClick={memberAvatarClick}
            />
          </div>
        )}
      </div>
		</Styled>
  );
};

export default RoomPage;
