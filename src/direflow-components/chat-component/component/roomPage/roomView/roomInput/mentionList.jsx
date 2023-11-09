import React, { useEffect, useState, useRef } from "react";
import RoomAvatar from "../../../roomAvatar/roomAvatar";
import UserAvatar from "../../../userAvatar/userAvatar";
import { getMemberName } from "../../../../utils";

const MentionList = (props) => {
  const { room, memberList, memberListFocus, handleAtMemberClick } = props;
  const listRef = useRef({});

  useEffect(() => {
    if (memberList && memberList[memberListFocus]) {
      const m = memberList[memberListFocus];
      const k = m.isRoom ? 'room' : m.userId;
      const ref = listRef.current[k];
      ref && ref.scrollIntoView({block: 'nearest'});
    }
  }, [memberListFocus]);

  const spawnMentionItems = (data) => {
    const arr = [];
    if (data.length) {
      for (let i = 0; i < data.length; i++) {
        const m = data[i];
        const k = m.isRoom ? 'room' : m.userId;
        arr.push(<div
          key={k}
          className={[
            "room-input_at_item",
            i === memberListFocus && "room-input_at_item_bgFocus"
          ].join(' ')}
          onMouseDown={(e) => handleAtMemberClick(m, e)}
          onTouchStart={(e) => handleAtMemberClick(m, e)}
          ref={(ref) => {listRef.current[k] = ref}}
        >
          <div className="room-input_at_item_avatar">
            {m.isRoom ? <RoomAvatar room={room} /> : <UserAvatar member={m} />}
          </div>
          <div className="room-input_at_item_name">{m.isRoom ? 'room' : getMemberName(m)}</div>
        </div>);
        if (m.isRoom && data.length > 1) {
          arr.push(<div className="divide" key={'divide'}></div>);
        }
      }
    }
    return arr;
  }
  return <div className="room-input_at">
    {spawnMentionItems(memberList)}
  </div>
}

export default React.memo(MentionList)