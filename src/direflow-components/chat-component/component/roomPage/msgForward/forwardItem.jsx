import React, { useEffect, useState } from "react";
import { checkIcon, circleIcon } from "../../../imgs/svgs";
import { formatTextLength, getAddressByUserId } from "../../../utils/index";
import RoomAvatar from "../../roomAvatar/roomAvatar";
import { api } from "../../../api";

const ForwardItem = ({
  item,
  handleItemClick
}) => {
  const myUserId = api.getUserId();
  const [checked, setChecked] = useState(false);
  let avatarUrl, name, id, urls;
  if (item.isDmRoom()) {
    const members = item.currentState.getMembers();
    const anyMember = members.find((m) => m.userId !== myUserId);
    if (anyMember) {
      avatarUrl = anyMember.getMxcAvatarUrl();
      name = anyMember.name;
      id = getAddressByUserId(anyMember.userId);
    }
  } else {
    avatarUrl = item.getMxcAvatarUrl();
    if (!avatarUrl) {
      urls = [];
      const members = item.getJoinedMembers();
      let m;
      for (let i = 0; i < members.length; i++) {
        m = members[i]?.getMxcAvatarUrl();
        if (m) {
          urls.push(m);
        }
      }
      const fillArr = new Array(members.length - urls.length).fill(null);
      urls.push(...fillArr)
    }
    name = item.name;
    id = item.roomId;
  }

  useEffect(() => {
    setChecked(item.isSelected);
  }, [item.isSelected])

  return id ? <div className="members_item" onClick={() => {
    handleItemClick(item)
  }}>
    <div className="members_item_select">
      {checked ? checkIcon : circleIcon}
    </div>
    <div className="members_item_avatar">
      <RoomAvatar room={item} />
    </div>
    <div className="members_item_desc">
      <p className="members_item_desc_name">{formatTextLength(name, 24, 5)}</p>
      <p className="members_item_desc_addr">{id}</p>
    </div>
  </div> : null
}

export default React.memo(ForwardItem)