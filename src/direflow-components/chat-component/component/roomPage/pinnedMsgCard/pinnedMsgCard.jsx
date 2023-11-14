import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./pinnedMsgCard.css";
import { api } from "../../../api";
import { formatTextLength, formatUserName, getEventById, getMemberName } from "../../../utils/index";
import { closeIcon } from "../../../imgs/svgs";

const PinnedMsgCard = (props) => {
  const { roomId, pinnedIds, pinnedCloseClick, memberAvatarClick, onPinnedClick } = props;
  const [dataList, setDataList] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      if (!pinnedIds || pinnedIds.length <= 0) return;
      const room = api._client.getRoom(roomId);
      if (!room) return
      // const sdnEvent = room.currentState.getStateEvents('m.room.pinned_events', '');
      // const sender = sdnEvent?.sender;
      const list = [];
      for (let i = 0; i < pinnedIds.length; i++) {
        if (!isMounted) return
        let sdnEvent = room.findEventById(pinnedIds[i]);
        let event = sdnEvent?.event;
        if (!event) {
          event = await getEventById(roomId, pinnedIds[i], false, true);
        }
        const { type, content, event_id, sender } = event;
        const member = room.getMember(sender);
        // const { displayname } = await api._client.getProfileInfo(sender);
        const body = type === 'm.room.message' ? content.body : '';
        const name = formatUserName(getMemberName(member));
        list.push({
          id: event_id,
          userId: sender,
          name,
          body
        });
      }
      if (!isMounted) return
      setDataList(list);
    }
    initData();
    return (() => {
      isMounted = false;
    })
  }, [pinnedIds])

  const onClickUser = (e, userId) => {
    memberAvatarClick(userId);
    e.stopPropagation();
    e.preventDefault();
  }

  return (dataList[index] ?
    <Styled styles={styles}>
      <div className="pinned_msg_card">
        <div className="pinned_msg_card_left"></div>
        <div className="pinned_msg_card_center" onClick={() => onPinnedClick(dataList[index].id)}>
          <p className="pinned_msg_card_center_user">
            <span onClick={(e) => { onClickUser(e, dataList[index].userId) }}>{dataList[index].name}</span> Pinned Message
          </p>
          <p className="pinned_msg_card_center_text">{dataList[index].body}</p>
        </div>
        <div className="pinned_msg_card_right svg-btn svg-btn-fill" onClick={() => pinnedCloseClick(dataList[index].id)}>
          {closeIcon}
        </div>
      </div>
    </Styled> : null
  );
};

export default React.memo(PinnedMsgCard);
