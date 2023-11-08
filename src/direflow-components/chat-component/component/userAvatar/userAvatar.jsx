import React, { useCallback } from "react";
import { AvatarComp } from "../avatarComp/avatarComp";
import { getDefaultAvatar } from "../../utils";

const UserAvatar = ({ user, member }) => {

  const renderAvatar = useCallback((user, member) => {
    let url;
    if (user) {
      url = user.avatarUrl || user.avatar_url;
    } else if (member) {
      url = member.getMxcAvatarUrl();
    }
    if (!url) {
      const id = user?.userId || user?.user_id || member?.userId;
      url = getDefaultAvatar(id);
    }
    return <AvatarComp url={url} />
  })

  return renderAvatar(user, member)
}

export default React.memo(UserAvatar);