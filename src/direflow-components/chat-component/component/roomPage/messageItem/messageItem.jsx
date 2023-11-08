import React, { useEffect, useRef, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./messageItem.css";
import { api } from "../../../api";
import { formatTextLength, getMemberName, renderTs } from "../../../utils/index";
import { AvatarComp } from "../../../component/avatarComp/avatarComp";
import { roomTitleMoreIcon } from "../../../imgs/index";
import { checkIcon, circleIcon, msgCheckIcon, msgCircleIcon } from "../../../imgs/svgs";
import UserAvatar from "../../userAvatar/userAvatar";
import { SendingNetworkEvent } from "sendingnetwork-js-sdk";
import { Relations } from "sendingnetwork-js-sdk";
import ThumbupRow from './ThumbupRow'; // EventTile

const MessageItem = ({
  roomId,
  roomViewRef,
  room,
  sdnEvent,
  members,
  setShowMoreMenu,
  setMoreOperateMsg,
  setCurReactions,
  memberAvatarClick,
  group,
  groupStr,
  msgContentView,
  showCheckbox,
  onCheckChanged,
  openUrlPreviewWidget
}) => {
  const messageItemRef = useRef(null);
  const message = sdnEvent.event;// raw event
  const { combine } = sdnEvent;// RoomMember
  let sender = sdnEvent;
  if (!sender || !sender.user) {
    sender = room.getMember(message.sender);
  }
  const { event_id, type, content, origin_server_ts } = message;
  const msgtype = content?.msgtype || '';
  const isImage = (type === 'm.room.message' && (msgtype === 'm.image' || msgtype === 'm.gif') && !message.isDeleted);
  const userId = room.myUserId;
  const senderId = sender.userId; // user who has sent current msg
  const [checked, setChecked] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const showReactions = true; // RoomView
  const timelineSet = room.getUnfilteredTimelineSet(); // RoomView
  const getRelationsForEvent = ( // TimelinePanel
    eventId,
    relationType,
    eventType
  ) =>
    timelineSet.getRelationsForEvent(
        eventId,
        relationType,
        eventType
    );
  const getReactions = (type) => { // EventTile
    if (
        !showReactions ||
        !getRelationsForEvent
    ) {
        return null;
    }
    const eventId = event_id
    const res = getRelationsForEvent(eventId, "m.annotation", "m.reaction");
    return res
  };
  const [reactions, setReactions] = useState(getReactions('useState')); // EventTile

  const onReactionsCreated = (relationType, eventType) => { // EventTile
    console.log('---Event.relationsCreated---', onReactionsCreated)
    if (relationType !== "m.annotation" || eventType !== "m.reaction") {
      return;
    }
    sdnEvent.removeListener("Event.relationsCreated", onReactionsCreated);
    setReactions(getReactions())
  };
  const targetEvent = new SendingNetworkEvent({
    "sender": message.sender,
    "type": type,
    "event_id": event_id,
    "room_id": roomId,
    "content": content,
  });
  useEffect(() => {
    onRead(sdnEvent);
    // room.on("Room.receipt", onRead);

    api.on('highlightRelateReply', (id) => {
      if (id === 'message_item_' + event_id) {
        const clickTarget = messageItemRef.current
        if (!clickTarget) {
          return
        }
        clickTarget.scrollIntoView({
          block: "center",
          behavior: "auto",
        })
        clickTarget.style.backgroundColor = '#D2D5D9'
        setTimeout(() => {
          clickTarget.style.backgroundColor = 'unset'
        }, 2000)
      }
    })

    if (showReactions) { // EventTile
      sdnEvent.on("Event.relationsCreated", onReactionsCreated)
    }
    return (() => {
      // room.off("Room.receipt", onRead);
      if (showReactions) { // EventTile
        sdnEvent.removeListener("Event.relationsCreated", onReactionsCreated);
      }
    });
  }, [])

  useEffect(() => {
    if (sdnEvent) {
      setChecked(sdnEvent.checked);
    }
  }, [sdnEvent?.checked]);

  const onRead = (event) => {
    if (event?.getId() == sdnEvent?.getId()) {
      const arr = room.getReceiptsForEvent(sdnEvent);
      if (arr && arr.length) {
        // console.log('onRead', arr);
        setReadCount(arr.length);
      }
    }
  }

  const httpString = (s) => {
    if (!s) return null;
    var reg = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    s = s.match(reg);
    return s;
  };

  const clickMsgItem = (e) => { // open msg more operations dialog when clicked one msg
    if (showCheckbox) return
    if (sdnEvent.event.isDeleted) return // forbid more operations for deleted msg
    e.stopPropagation();
    e.preventDefault(); // prevent right mouse default operations

    const { x, y } = roomViewRef?.current.getBoundingClientRect()
    console.log('position information：', [e, e.target, e.clientX, x, e.clientY, y, e.pageX, e.pageY])
    // setShowMoreMenu(true);
    // setShowMoreMenu({ left: e.clientX - x, top: e.clientY - y });
    let [left, top] = [e.clientX - x, e.clientY - y]
    setShowMoreMenu({ left, top });
    setMoreOperateMsg(sdnEvent)
    setCurReactions(reactions)
  }

  const handleEmotionClick = (emoji) => {
    console.log('handle thumbup action in more thumbup emojis panel')
  }
  const isPreviewCard = () => {
    const { body } = content;
    const urls = httpString(body);
    if (type === 'm.room.message' && msgtype === 'm.text' && urls) {
      return true;
    }

    return false;
  }

  const showTime = () => {
    if (message.isDeleted) {
      return false;
    }
    if (isPreviewCard()) {
      return false;
    }
    if (content['m.relates_to']) {
      return false;
    }
    return true;
  }

  const shouldShowUserName = () => {
    if (room?.getJoinedMemberCount() <= 2 || room?.isDmRoom()) {
      return false;
    } else if (combine == 2 || combine == 3) {
      return false;
    } else {
      return true;
    }
  }

  const renderTime = () => {
    const time = renderTs(origin_server_ts);
    return time
    // if(group == 'day') {
    //   return time;
    // } else if (group == 'week') {
    //   return `${groupStr.slice(0, 3)} ${time}`;
    // } else if (group == 'year') {
    //   return `${groupStr.slice(0, -5)} ${time}`;
    // } else {
    //   return `${groupStr} ${time}`;
    // }
  }

  const copyMessages = (messages) => {

  }

  const handleClick = (e) => { // click to select one msg
    if (showCheckbox) {
      // const next = !checked;
      // setChecked(next);
      const next = !sdnEvent.checked;
      sdnEvent.checked = next;
      onCheckChanged(sdnEvent, next);
    }
    // console.log('target', e?.target);
    if (e?.target?.href) {
      const innerHtml = e.target.innerHTML;
      if (innerHtml.startsWith('@')) {
        const userName = innerHtml.slice(1, innerHtml.length);
        const member = members.find(m => getMemberName(m) === userName);
        if (member) {
          memberAvatarClick(member.userId);
        }
      } else {
        openUrlPreviewWidget(e.target.href);
      }
      e.stopPropagation();
      e.preventDefault();
    }
    console.log(sdnEvent);
  }

  return msgContentView ? (
    <Styled styles={styles}>
      <div className={`msgItem ${checked ? 'checked' : ''}`} ref={messageItemRef} onClick={handleClick}>
        {/* m.room.message */}
        {type === 'm.room.message' && (
          <div className={`message_item${combine ? " combine" + combine : ""}`}>
            {showCheckbox ? <div className="msg_checkbox">
              {checked ? checkIcon : circleIcon}
            </div> : null}
            {senderId === userId ? (
              <div className="msgBox_right" key={event_id}>
                <div className={`msgBox_right_info${combine ? " combine" + combine : ""}`}>
                  <div className={["msgBox_right_info_msg", isPreviewCard() && "msgBox_show_card", message.isDeleted && 'wrapper_deleted_msg', isImage && 'image'].join(" ")} onContextMenu={clickMsgItem}>
                    {msgContentView}
                    {showTime() && <span className="msg_time">{`${message.isEdited ? '(edited) ' : ''}${renderTime()}`}</span>}
                  </div>
                  {/* {content.userThumbsUpEmojiList?.length > 0 && <div className="msgBox_right_info_thumb_up">
                    {content.userThumbsUpEmojiList.map((emoji, emojiIndex) => {
                      return (
                        <div
                          className="msgBox_info_thumb_up_item"
                          key={emojiIndex}
                          onClick={() => handleEmotionClick(emoji)}
                        >
                          <span className="emoji_icon">{emoji.key}</span>
                          <span className="emoji_count">{emoji.senderList?.length}</span>
                        </div>
                      )
                    })}
                  </div>} */}
                  <ThumbupRow
                    mxEvent={sdnEvent}
                    reactions={reactions}
                    isOwn={true}
                    roomId={roomId}
                    room={room}
                  />
                  {/* {reactions && genReactionsRowButton()} */}
                </div>
                {/* <div className="msg-read-icon">{readCount ? msgCheckIcon : msgCircleIcon}</div> */}
              </div>
            ) : (
              <div className={`msgBox_left${showCheckbox ? ' show-checkbox' : ''}`} key={message.event_id}>
                {combine == 2 || combine == 3 ? <div className="msgBox_left_avatar" /> : <div className="msgBox_left_avatar" onClick={() => memberAvatarClick(sender.userId)}>
                  <UserAvatar member={sender} />
                  {/* <AvatarComp url={sender?.getMxcAvatarUrl()} /> */}
                </div>}
                <div className={`msgBox_left_info${combine ? " combine" + combine : ""}`}>
                  {shouldShowUserName() && <p className="msgBox_left_info_user">{getMemberName(sender)}</p>}
                  <div className={["msgBox_left_info_msg", isPreviewCard() && "msgBox_show_card", message.isDeleted && 'wrapper_deleted_msg', isImage && 'image'].join(" ")} onContextMenu={clickMsgItem}>
                    {msgContentView}
                    {showTime() && <span className="msg_time">{`${message.isEdited ? '(edited) ' : ''}${renderTime()}`}</span>}
                  </div>
                  {/* {content.userThumbsUpEmojiList?.length > 0 && <div className="msgBox_left_info_thumb_up">
                    {content.userThumbsUpEmojiList.map((emoji, emojiIndex) => {
                      return (
                        <div
                          className="msgBox_info_thumb_up_item"
                          key={emojiIndex}
                          onClick={() => handleEmotionClick(emoji)}
                        >
                          <span className="emoji_icon">{emoji.key}</span>
                          <span className="emoji_count">{emoji.senderList?.length}</span>
                        </div>
                      )
                    })}
                  </div>} */}
                  <ThumbupRow
                    mxEvent={sdnEvent}
                    reactions={reactions}
                    isOwn={false}
                    roomId={roomId}
                    room={room}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* m.room.pinned_events */}
        {type === 'm.room.pinned_events' && (
          <div className="pin_event_item">{msgContentView}</div>
        )}

        {/* m.room.customized_events */}
        {type === 'm.room.customized_events' && (
          <div className="red_envelope_event_item">{msgContentView}</div>
        )}

        {/* m.room.member event */}
        {type === 'm.room.member' && (
          <div className="member_event_item">{msgContentView}</div>
        )}

        {/* m.room.create event */}
        {type === 'm.room.create' && (
          <div className="member_event_item">{msgContentView}</div>
        )}
      </div>
    </Styled>
  ) : null
};

export default React.memo(MessageItem);
