import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./pinnedMsgCard.css";
import { api } from "../../../api";
import { formatTextLength, formatUserName, getEventById, getMemberName } from "../../../utils/index";
import { closeIcon } from "../../../imgs/svgs";

const jumpLinkMsg = (id) => {
  console.log('jumpLinkMsg', 'message_item_' + id)
  api.eventEmitter && api.eventEmitter.emit && api.eventEmitter.emit('highlightRelateReply', 'message_item_' + id);
}

const PinnedMsgCard = (props) => {
  const { roomId, pinnedIds, pinnedCloseClick } = props;
  const [dataList, setDataList] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    initData()
  }, [pinnedIds])

  const initData = async () => {
    if (!pinnedIds || pinnedIds.length <= 0) return;
    const room = api._client.getRoom(roomId);
    if (!room) return
    // const sdnEvent = room.currentState.getStateEvents('m.room.pinned_events', '');
    // const sender = sdnEvent?.sender;
    const list = [];
    for (let i = 0; i < pinnedIds.length; i++) {
      const event = await getEventById(roomId, pinnedIds[i], false, true);
      const { type, content, event_id, sender } = event;
      const member = room.getMember(sender);
      // const { displayname } = await api._client.getProfileInfo(sender);
      const body = type === 'm.room.message' ? content.body : '';
      const name = formatUserName(getMemberName(member));
      list.push({
        id: event_id,
        name,
        body
      });
    }
    setDataList(list);
  }

  return (dataList[index] ?
    <Styled styles={styles}>
      <div className="pinned_msg_card">
        <div className="pinned_msg_card_left"></div>
        <div className="pinned_msg_card_center" onClick={() => jumpLinkMsg(dataList[index].id)}>
          <p className="pinned_msg_card_center_user">{dataList[index].name} Pinned Message</p>
          <p className="pinned_msg_card_center_text">{dataList[index].body}</p>
        </div>
        <div className="pinned_msg_card_right svg-btn svg-btn-fill" onClick={() => pinnedCloseClick(dataList[index].id)}>
          {closeIcon}
        </div>
      </div>
    </Styled> : null
  );
};

export default PinnedMsgCard;
