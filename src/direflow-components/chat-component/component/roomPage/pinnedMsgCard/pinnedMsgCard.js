import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./pinnedMsgCard.css";
import { api } from "../../../api";
import { formatTextLength, getEventById } from "../../../utils/index";


const PinnedMsgCard = ({ roomId, pinnedIds, pinnedCloseClick }) => {
  const [userName, setUserName] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    initData()
  }, [pinnedIds])

  const initData = async () => {
    if (!pinnedIds || pinnedIds.length <= 0) return;
    const {type, content, sender} = await getEventById(roomId, pinnedIds[0]);
    const { displayname } = await api._client.getProfileInfo(sender);
    let textBody = content.msgtype === 'm.image' ? '[picture]' : content.body;
    let name = formatTextLength(displayname || sender, 30, 5);
    setContent(textBody);
    setUserName(name);
  }

  return (
    <Styled styles={styles}>
      <div className="pinned_msg_card">
        <div className="pinned_msg_card_left"></div>
        <div className="pinned_msg_card_center">
          <p className="pinned_msg_card_center_user">{userName} Pinned Message #1</p>
          <p className="pinned_msg_card_center_text">{content}</p>
        </div>
        <div className="pinned_msg_card_right" onClick={pinnedCloseClick}>
          <span>X</span>
        </div>
			</div>
		</Styled>
  );
};

export default PinnedMsgCard;
