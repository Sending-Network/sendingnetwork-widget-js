import React, { useEffect, useState, useRef } from "react";
import { Styled } from "direflow-component";
import InfiniteScroll from "react-infinite-scroll-component";
import Censor from "mini-censor";
import styles from "./touristRoom.css";
import TouristMsgItem from "../touristMsgItem/touristMsgItem";
import TouristInput from "../touristInput/touristInput";
import TouristPinnedCard from "../touristPinnedCard/touristPinnedCard";
import { roomViewBg, touristLockIcon } from "../../../imgs/index";
import { filterLibrary } from "../../../utils/index";
import { api } from "../../../api";

const TouristRoom = ({ roomId, toLogin }) => {
  const censor = new Censor(filterLibrary.get());
  const roomViewRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [pinnedIds, setPinnedIds] = useState([]);
  const [fromToken, setFromToken] = useState("");
  const [previewImgUrl, setPreviewImgUrl] = useState("");
  const [isShowPreviewImg, setIsShowPreviewImg] = useState(false);
  const [curRoom, setCurRoom] = useState(null);

  useEffect(() => {
    init();
    return () => {
      stop();
    };
  }, [])

  useEffect(() => {
    checkPinnedEvent(messages)
  }, [messages])

  const init = async () => {
    await start();
    await api.touristClient.joinRoom(roomId);
    const room = api.touristClient.getRoom(roomId);
    setCurRoom(room);
  }

  const start = async () => {
    await api.touristClient.startClient();
    await roomViewStart();
    api.touristClient.on("Room.timeline", onTimeLine);
  };

  const stop = async () => {
    const roomTmp = api.touristClient.getRoom(roomId);
    if (roomTmp) {
      const events = roomTmp.getLiveTimeline().getEvents();
      if (events.length) {
        api.touristClient.sendReadReceipt(events[events.length - 1]);
      }
    }
    api.touristClient.stopClient();
    api.touristClient.removeListener("Room.timeline", onTimeLine);
  };

  const roomViewStart = async () => {
    try {
      await queryMessage();
    } catch (error) {}
    setTimeout(scrollToBottom, 100);
  };

  const showPreviewImg = (url) => {
    setPreviewImgUrl(url);
    setIsShowPreviewImg(true);
  };

  const hidePreviewImg = (e) => {
    setPreviewImgUrl("");
    setIsShowPreviewImg(false);
    return false;
  };

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

  const queryMessage = async (flag) => {
    if (!flag && !fromToken) {
      const { end, chunk } = await api.touristClient.createMessagesRequest(
        roomId,
        fromToken,
        20,
        "b"
      );
      const msgs = chunk.reverse();
      const filteredMsgs = msgCensorFilter(msgs);
      setFromToken(end);
      setMessages(filteredMsgs);
    }
    if (flag === "start" && fromToken) {
      const { end, chunk } = await api.touristClient.createMessagesRequest(
        roomId,
        fromToken,
        20,
        "b"
      );
      setFromToken(end);
      setMessages((val) => [...chunk.reverse(), ...val]);
    }
  };

  const scrollToBottom = (oh) => {
    const domWrapper = roomViewRef.current;
    if (domWrapper) {
      if (oh) {
        const h = roomViewRef.current.scrollHeight - oh;
        domWrapper.scrollTo(0, h);
      } else {
        domWrapper.scrollTo(0, domWrapper.scrollHeight);
      }
    }
  };

  const checkPinnedEvent = async (msgList) => {
    for (let i = msgList.length - 1; i >= 0; i--) {
      if (msgList[i].type === 'm.room.pinned_events') {
        const { content: { pinned } } = msgList[i];
        setPinnedIds(pinned || [])
        break;
      }
    }
  }

	const onTimeLine = (event) => {
    if (event.getType() !== "m.call.invite") {
      const eventArr = msgCensorFilter([event.event])
      setMessages((messages) => {
        const list = eventArr.filter(ev => {
          return !messages.find(msg => msg.event_id === ev.event_id)
        })
        return [...messages, ...list];
      });
      setTimeout(scrollToBottom, 100);
    }
  };

  const loadMore = async () => {
    const curSH = roomViewRef.current.scrollHeight;
    await queryMessage("start");
    // setTimeout(() => scrollToBottom(curSH), 100);
  };

  const handleWalletConnect = () => {
    toLogin();
  };

  return (
    <Styled styles={styles}>
      <div className="touristRoom">
        <div className="touristRoom_title">{curRoom?.name || roomId}</div>
        {pinnedIds.length > 0 && (
          <TouristPinnedCard
            roomId={roomId}
            pinnedIds={pinnedIds}
          />
        )}
        <div
          className="touristRoom_roomview"
          id="scrollableDiv"
          ref={roomViewRef}
          style={{backgroundImage: `url(${roomViewBg})`}}
        >
          <InfiniteScroll
            dataLength={messages.length}
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
            <div className="touristRoom_msg-top-station"></div>
            {messages.map((message, index) => {
              return <TouristMsgItem
                key={index}
                message={message}
                showPreviewImg={showPreviewImg}
              />
            })}
            <div className="touristRoom_msg-bottom-station"></div>
          </InfiniteScroll>
        </div>

        {/* input Comp */}
        <TouristInput />

        {/* tourist lock */}
        <div className="touristRoom_lock">
          <div className="touristRoom_lock_btn" onClick={handleWalletConnect}>
            <img src={touristLockIcon} />
            <span>Connect Wallet to Chat</span>
          </div>
        </div>

        {/* img preview */}
        {isShowPreviewImg && (
          <div className="touristRoom_previewImg" onClick={hidePreviewImg}>
            <img src={previewImgUrl} onClick={(e) => e.stopPropagation()}/>
          </div>
        )}
      </div>
		</Styled>
  );
};

export default TouristRoom;
