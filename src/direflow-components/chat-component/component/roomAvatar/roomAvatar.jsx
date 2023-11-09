import React, { useCallback, useEffect, useState } from "react";
import { AvatarMutiComp, AvatarComp } from "../avatarComp/avatarComp";
import { api } from "../../api";
import UserAvatar from "../userAvatar/userAvatar";
import { getDefaultAvatar } from "../../utils";

const RoomAvatar = ({ room }) => {

  const renderAvatar = (room) => {
    if (!room || !room.roomId) return null
    const url = room.getMxcAvatarUrl();
    const myUserId = api.getUserId();
    if (url) {
      return <AvatarComp url={url} />
    }
    const members = room.currentState.getMembers();
    if (room.isDmRoom()) {
      const anyMember = members.find((m) => m.userId !== myUserId);
      // const avatarUrl = anyMember?.getMxcAvatarUrl() || '';
      // return <AvatarComp url={avatarUrl} />
      return <UserAvatar member={anyMember} />
    }
    const urls = [];
    let m;
    for (let i = 0; i < members.length; i++) {
      m = members[i]?.getMxcAvatarUrl();
      if (m) {
        urls.push(m);
      } else if (members[i]?.userId) {
        urls.push(getDefaultAvatar(members[i]?.userId))
      }
    }
    const fillArr = new Array(members.length - urls.length).fill(null);
    urls.push(...fillArr)
    return <AvatarMutiComp urls={urls} />
  }

  return renderAvatar(room)
}

export default React.memo(RoomAvatar);