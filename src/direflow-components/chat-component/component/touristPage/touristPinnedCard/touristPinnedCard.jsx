import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./touristPinnedCard.css";
import { api } from "../../../api";
import { formatTextLength, getEventById} from "../../../utils/index";


const TouristPinnedCard = ({ roomId, pinnedIds }) => {
  const [userName, setUserName] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    initData()
  }, [pinnedIds])

  const initData = async () => {
    if (!pinnedIds || pinnedIds.length <= 0) return;
    const {content, sender} = await getEventById(roomId, pinnedIds[0], true);
    const userInfo = api.touristClient.getUser(sender);
    let textBody = content.msgtype === 'm.image' ? '[picture]' : content.body;
    let name = formatTextLength(userInfo?.displayname || sender, 30, 5);
    setContent(textBody);
    setUserName(name);
  }

  return (
    <Styled styles={styles}>
      <div className="tourist_pinned_card">
        <div className="tourist_pinned_card_left"></div>
        <div className="tourist_pinned_card_center">
          <p className="tourist_pinned_card_center_user">{userName} Pinned Message #1</p>
          <p className="tourist_pinned_card_center_text">{content}</p>
        </div>
        <div className="tourist_pinned_card_right"></div>
			</div>
		</Styled>
  );
};

export default TouristPinnedCard;
