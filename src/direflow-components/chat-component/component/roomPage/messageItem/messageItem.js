import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./messageItem.css";
import { api } from "../../../api";
import { formatTextLength } from "../../../utils/index";
import { AvatarComp } from "../../../component/avatarComp/avatarComp";
import UrlPreviewComp from "../../UrlPreviewComp/UrlPreviewComp";
import { roomTitleMoreIcon } from "../../../imgs/index";

const MessageItem = ({
  room,
  message,
  members,
  pinnedIds,
  myUserData,
  openUrlPreviewWidget,
  showPreviewImg,
  pinClick,
  memberAvatarClick
}) => {
  const { event_id, sender, type, content, origin_server_ts } = message;
  const userId = room.myUserId;
  const userData = api._client.getUser(sender);
  const { displayname } = myUserData;
  const atUserName = '@'+displayname;

  const [showMore, setShowMore] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [pinText, setPinText] = useState("Pin");

  useEffect(() => {
    if (pinnedIds && pinnedIds[0] === event_id) {
      setPinText("UnPin")
    } else {
      setPinText("Pin")
    }
  }, [pinnedIds])

  const httpString = (s) => {
    var reg = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    s = s.match(reg);
    return s;
  };

  const formatSender = (sender) => {
    const member = members.find((member) => member.userId == sender);
    if (member) {
      const { name } = member;
      return formatTextLength(name, 13, 5)
    }
    return "";
  };

  const highlightAt = (bodyStr) => {
    let resultArr = [];
    if (bodyStr.indexOf(atUserName) !== -1) {
      const arr = bodyStr.split(atUserName);
      arr.map((v, vIndex) => {
        resultArr.push(v);
        if (vIndex !== arr.length - 1) {
          resultArr.push(atUserName)
        }
      })
    }
    return resultArr
  }

  const renderMsgContent = () => {
    let msgContent = null;
    if (type === 'm.room.pinned_events') {
      const { pinned = [] } = content;
      const userNick = formatSender(sender);
      msgContent = pinned.length > 0 ? `${userNick} Pinned a message` : `${userNick} UnPinned message`;
    } else if (type === 'm.room.message') {
      const { body, msgtype, ...other } = content;
      switch (msgtype) {
        case "m.text":
          const urls = httpString(body);
          if (urls) {
            const [urlBody] = urls;
            msgContent = (
              <UrlPreviewComp
                url={urlBody}
                message={body}
                ts={origin_server_ts}
                openUrlPreviewWidget={openUrlPreviewWidget}
              />
            );
          } else if (content.format && content.format === 'org.sdn.custom.html') {
            const arrs = highlightAt(body)
            msgContent = arrs.length > 0 ?
              <p>{arrs.map((v, vIndex) => {
                return <span key={vIndex} className={[v === atUserName ? "msgBox_at_highlight" : ""]}>{v}</span>
              })}</p> : body
          } else {
            msgContent = body;
          }
          break;
        case "m.image":
          let url = api._client.mxcUrlToHttp(other.url);
          msgContent = (
            <img
              style={{ maxWidth: "100%", cursor: 'pointer', marginTop: '2px' }}
              src={`${url}`}
              onClick={() => showPreviewImg(url)}
            />
          );
          break;
        default: break;
      }
    }
    return msgContent;
  };

  const renderTs = (ts) => {
    const h = new Date(ts).getHours();
    let m = new Date(ts).getMinutes();
    if (m <= 9) {
      m = '0' + m;
    }
    return `${h}:${m}`;
  };

  const handleMoreClick = (e) => {
    e.stopPropagation();
    setShowMore(true)
    setShowMoreMenu(true);
  }

  const closeMoreWrap = (e) => {
    e.stopPropagation();
    setShowMore(false);
    setShowMoreMenu(false);
  }

  const handlePinClick = async (e) => {
    closeMoreWrap(e);
    const pinnedIds = [];
    if (pinText === 'Pin') {
      pinnedIds.push(event_id);
      api._client.setRoomAccountData(room.roomId, 'im.vector.room.read_pins', {
        event_ids: [
            ...(room.getAccountData('im.vector.room.read_pins')?.getContent()?.event_ids || []),
            event_id,
        ],
      });
    }
    await api._client.sendStateEvent(room.roomId, 'm.room.pinned_events', { pinned: pinnedIds }, "");
    pinClick(message, pinText);
  }

  const handleMouseEnter = () => {
    if (pinnedIds.length <= 0 || (pinnedIds.length > 0 && pinnedIds[0] === event_id)) {
      setShowMore(true)
    } else {
      setShowMore(false)
    }
  }

  return ['m.room.message', 'm.room.pinned_events'].includes(type) ? (
    <Styled styles={styles}>
      <div className="msgItem">
        {/* m.room.message */}
        {type === 'm.room.message' && (
          <div className="message_item"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShowMore(false)}
          >
            {sender === userId ? (
              <div className="msgBox_right" key={event_id}>
                <div className="msgBox_right_info">
                  <div className="msgBox_right_info_msg">
                    {renderMsgContent()}
                    <p className="msgBox_right_info_msg_time">{renderTs(origin_server_ts)}</p>
                    {(showMore || showMoreMenu) && (
                      <div className="msgBox_more msgBox_more_right" onClick={handleMoreClick}>
                        <img className="msgBox_more_img" src={roomTitleMoreIcon} />
                        {showMoreMenu && (<div className="msgBox_more_menu_wrap" onClick={closeMoreWrap}></div>)}
                        {showMoreMenu && (
                          <div className="msgBox_more_menu msgBox_more_menu_right">
                            <div className="msgBox_more_menu_item" onClick={handlePinClick}>{pinText}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="msgBox_left" key={message.event_id}>
                <div className="msgBox_left_avatar" onClick={() => memberAvatarClick(sender)}>
                  <AvatarComp url={userData.avatarUrl} />
                </div>
                <div className="msgBox_left_info">
                  <p className="msgBox_left_info_user">{formatSender(sender)}</p>
                  <div className="msgBox_left_info_msg">
                    {renderMsgContent()}
                    <span className="msgBox_left_info_msg_time">{renderTs(origin_server_ts)}</span>
                  </div>
                  {(showMore || showMoreMenu) && (
                    <div className="msgBox_more msgBox_more_left" onClick={handleMoreClick}>
                      <img className="msgBox_more_img" src={roomTitleMoreIcon} />
                      {showMoreMenu && (<div className="msgBox_more_menu_wrap" onClick={closeMoreWrap}></div>)}
                      {showMoreMenu && (
                        <div className="msgBox_more_menu msgBox_more_menu_left">
                          <div className="msgBox_more_menu_item" onClick={handlePinClick}>{pinText}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {/* m.room.pinned_events */}
        {type === 'm.room.pinned_events' && (
          <div className="pin_event_item">{renderMsgContent()}</div>
        )}
      </div>
		</Styled>
  ) : null
};

export default MessageItem;
