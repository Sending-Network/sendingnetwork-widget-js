import React from "react";
import { Styled } from "direflow-component";
import styles from "./touristMsgItem.css";
import { formatTextLength } from "../../../utils/index";
import { AvatarComp } from "../../avatarComp/avatarComp";
import UrlPreviewComp from "../../UrlPreviewComp/UrlPreviewComp";
import { api } from "../../../api";

const TouristMsgItem = ({
  message,
  showPreviewImg,
}) => {
  const { sender, type, content, origin_server_ts } = message;
  const userData = api.touristClient.getUser(sender);

  const httpString = (s) => {
    var reg = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    s = s.match(reg);
    return s;
  };

  const formatSender = (sender) => {
    const userInfo = api.touristClient.getUser(sender);
    const nameStr = userInfo?.displayName || sender;
    return formatTextLength(nameStr, 13, 5)
  };

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
                openUrlPreviewWidget={() => {}}
              />
            );
          } else {
            msgContent = body;
          }
          break;
        case "m.image":
          let url = api.touristClient.mxcUrlToHttp(other.url);
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

  return ['m.room.message', 'm.room.pinned_events'].includes(type) ? (
    <Styled styles={styles}>
      <div className="msgItem">
        {/* m.room.message */}
        {type === 'm.room.message' && (
          <div className="message_item">
            <div className="msgBox_left" key={message.event_id}>
              <div className="msgBox_left_avatar">
                <AvatarComp url={userData?.avatarUrl} />
              </div>
              <div className="msgBox_left_info">
                <p className="msgBox_left_info_user">{formatSender(sender)}</p>
                <div className="msgBox_left_info_msg">
                  {renderMsgContent()}
                  <span className="msgBox_left_info_msg_time">{renderTs(origin_server_ts)}</span>
                </div>
              </div>
            </div>
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

export default TouristMsgItem;
