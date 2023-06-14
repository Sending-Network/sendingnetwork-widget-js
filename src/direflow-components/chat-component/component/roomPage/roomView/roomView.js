import React, { useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
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
  const [myUserData, setMyUserData] = useState({});

  useEffect(() => {
    roomViewStart();
    api._client.on("Room.timeline", onTimeLine);
    initMyData();
    return () => {
      api._client.removeListener("Room.timeline", onTimeLine);
    };
  }, []);

  const initMyData = async () => {
    const userData = await api._client.getProfileInfo(room.myUserId);
    setMyUserData(userData);
  }

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
    if (!flag && !fromToken) {
      const { end, chunk } = await api._client.createMessagesRequest(
        roomId,
        fromToken,
        20,
        "b"
      );
      const messages = chunk.reverse();
      const filteredMsgs = msgCensorFilter(messages)
      setFromToken(end);
      setMessages(filteredMsgs);
    }
    if (flag === "start" && fromToken) {
      const { end, chunk } = await api._client.createMessagesRequest(
        roomId,
        fromToken,
        20,
        "b"
      );
      setFromToken(end);
      setMessages((val) => [...chunk.reverse(), ...val]);
    }
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
    if (event.getType() == "m.call.invite") {
      // call func
    } else {
      const eventArr = msgCensorFilter([event.event])
      handlePinEvent(eventArr);
      setMessages((messages) => {
        return [...messages, ...eventArr];
      });
      setTimeout(scrollToBottom, 100);
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
    if (oh) {
      const h = roomViewRef.current.scrollHeight - oh;
      domWrapper.scrollTo(0, h);
    } else {
      domWrapper.scrollTo(0, domWrapper.scrollHeight);
    }
  };

  const loadMore = async () => {
    const curSH = roomViewRef.current.scrollHeight;
    await queryMessage("start");
    setTimeout(() => scrollToBottom(curSH), 100);
  };

  return (
    <Styled styles={styles}>
      <div
        className="roomView"
        id="scrollableDiv"
        ref={roomViewRef}
        style={{backgroundImage: `url(${roomViewBg})`}}
      >
        <InfiniteScroll
          dataLength={messages.length} //This is important field to render the next data
          hasMore={true}
          refreshFunction={loadMore}
          pullDownToRefresh
          pullDownToRefreshThreshold={10}
          pullDownToRefreshContent={
            <h3 style={{ textAlign: "center", color: "#fff" }}>
              Pull down to refresh
            </h3>
          }
          releaseToRefreshContent={
            <h3 style={{ textAlign: "center", color: "#fff" }}>loading...</h3>
          }
          scrollableTarget="scrollableDiv"
        >
          <div className="msg-top-station"></div>
          {messages.map((message, index) => {
            return <MessageItem
              key={index}
              room={room}
              message={message}
              members={members}
              pinnedIds={pinnedIds}
              myUserData={myUserData}
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
