import React, { useEffect, useState, useRef } from "react";
import { Styled } from "direflow-component";
import InfiniteScroll from "react-infinite-scroller";
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
  const [fetchDataLoading, setFetchDataLoading] = useState(false);
  const [canStartFetchData, setCanStartFetchData] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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
    setFetchDataLoading(true);
    const { end, chunk } = await api.touristClient.createMessagesRequest(
      roomId,
      fromToken,
      20,
      "b"
    );
    if (!flag && !fromToken) {
      const msgs = chunk.reverse();
      const filteredMsgs = msgCensorFilter(msgs);      
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

  const scrollToBottom = (oh) => {
    const domWrapper = roomViewRef.current;
    if (!domWrapper) return;
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
    if (event.getRoomId() !== roomId) return;
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
    if (fetchDataLoading || !canStartFetchData) return;
    await queryMessage("start");
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
          ref={roomViewRef}
          style={{backgroundImage: `url(${roomViewBg})`}}
        >
          <InfiniteScroll
            useWindow={false}
            isReverse={true}
            hasMore={hasMore}
            loadMore={loadMore}
            threshold={80}
            loader={<div className="touristRoom_roomview_scroll_loader" key={0}>Loading ...</div>}
          >
            {!hasMore && <div className="touristRoom_roomview_scroll_noMore">--- there's no more ---</div>}
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
