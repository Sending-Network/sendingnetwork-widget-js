import React, { useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroller";
import Censor from "mini-censor";
import { Styled } from "direflow-component";
import styles from "./roomView.css";
import { api } from "../../../api";
import { filterLibrary } from "../../../utils/index";
import { roomViewBg } from "../../../imgs/index";
import RoomInput from "./roomInput/roomInput";
import MessageItem from "../messageItem/messageItem";

const RoomView = ({
  roomId,
  pinnedIds,
  openUrlPreviewWidget,
  pinClick,
  memberAvatarClick,
  pinEventSync
}) => {
  const roomViewRef = useRef(null);
  const room = api._client.getRoom(roomId);
  const censor = new Censor(filterLibrary.get());

  const [fromToken, setFromToken] = useState("");
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [previewImgUrl, setPreviewImgUrl] = useState("");
  const [isShowPreviewImg, setIsShowPreviewImg] = useState(false);
  const [fetchDataLoading, setFetchDataLoading] = useState(false);
  const [canStartFetchData, setCanStartFetchData] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    roomViewStart();
    api._client.on("Room.timeline", onTimeLine);
    return () => {
      api._client.removeListener("Room.timeline", onTimeLine);
    };
  }, []);

  // fun
  const roomViewStart = async () => {
    try {
      await queryMembers();
    } catch (error) {}
    try {
      await queryMessage();
    } catch (error) {}
    setTimeout(scrollToBottom, 100);
  };

  const queryMessage = async (flag) => {
    setFetchDataLoading(true);
    const { end, chunk } = await api._client.createMessagesRequest(
      roomId,
      fromToken,
      20,
      "b"
    );
    if (!flag && !fromToken) {      
      const messages = chunk.reverse();
      const filteredMsgs = msgCensorFilter(messages);
      setMessages(filteredMsgs);
      setTimeout(() => setCanStartFetchData(true), 2000);
    }
    if (flag === "start" && fromToken) {
      setMessages((val) => [...chunk.reverse(), ...val]);
    }
    setHasMore(!!end);
    setFromToken(end);
    setFetchDataLoading(false);
  };

  const queryMembers = async () => {
    const members = room.getJoinedMembers();
    members.forEach((m) => {
      if (!m.user) {
        const user = api._client.getUser(m.userId);
        const [, address] = m.userId.split(":");
        user.setWalletAddress(`0x${address}`);
        m.user = user;
      }
    });
    setMembers(members);
  };

  const onTimeLine = async (event) => {
    if (event.getRoomId() !== roomId) return;
    if (event.getType() == "m.call.invite") {
      // call func
    } else {
      const eventArr = msgCensorFilter([event.event])
      handlePinEvent(eventArr);
      setMessages((messages) => {
        return [...messages, ...eventArr];
      });
    }
  };

  const handlePinEvent = (events) => {
    for (let index in events) {
      if (events[index].type === "m.room.pinned_events") {
        pinEventSync(events[index]);
        break;
      }
    }
  }

  const msgCensorFilter = (msgArr) => {
    const resultArr = msgArr || [];
    for (let i = 0; i < resultArr.length; i++) {
      const msg = resultArr[i];
      if (msg && msg.content && msg.content.msgtype === 'm.text') {
        const { text } = censor.filter(msg.content.body || '', { replace: true })
        resultArr[i]['content']['body'] = text
      }
    }
    return resultArr
  }

  // dom
  const showPreviewImg = (url) => {
    setPreviewImgUrl(url);
    setIsShowPreviewImg(true);
  };

  const hidePreviewImg = (e) => {
    setPreviewImgUrl("");
    setIsShowPreviewImg(false);
    return false;
  };

  const scrollToBottom = (oh) => {
    const domWrapper = roomViewRef.current;
    if (!domWrapper) return;
    if (oh) {
      const h = roomViewRef.current.scrollHeight - oh;
      domWrapper.scrollTo(0, h);
    } else {
      domWrapper.scrollTo(0, domWrapper.scrollHeight);
    }
  };

  const loadMore = async () => {
    if (fetchDataLoading || !canStartFetchData) return;
    await queryMessage("start");
  };

  return (
    <Styled styles={styles}>
      <div
        className="roomView"
        ref={roomViewRef}
        style={{backgroundImage: `url(${roomViewBg})`}}
      >
        <InfiniteScroll
          useWindow={false}
          isReverse={true}
          hasMore={hasMore}
          loadMore={loadMore}
          threshold={80}
          loader={<div className="roomView_scroll_loader" key={0}>Loading ...</div>}
        >
          {!hasMore && <div className="roomView_scroll_noMore">-- This is the beginning of the conversation --</div>}
          <div className="msg-top-station"></div>
          {messages.map((message, index) => {
            return <MessageItem
              key={index}
              room={room}
              message={message}
              members={members}
              pinnedIds={pinnedIds}
              openUrlPreviewWidget={openUrlPreviewWidget}
              showPreviewImg={showPreviewImg}
              pinClick={pinClick}
              memberAvatarClick={memberAvatarClick}
            />
          })}
          <div className="msg-bottom-station"></div>
        </InfiniteScroll>
        
        {/* input Comp */}
        <RoomInput roomId={roomId} />
        
        {/* img preview */}
        {isShowPreviewImg && (
          <div className="previewImg" onClick={hidePreviewImg}>
            <img src={previewImgUrl} onClick={(e) => e.stopPropagation()}/>
          </div>
        )}
      </div>
    </Styled>
  );
};

export default RoomView;
