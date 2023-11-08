import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./memberProfile.css";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { api } from "../../../api";
import { roomTitleBackIcon, copyIcon, setPageAvatarBg } from "../../../imgs/index";
import { showToast, formatTextLength, getAddressByUserId, getDefaultAvatar, showMessage } from "../../../utils/index";
import { AvatarComp } from "../../avatarComp/avatarComp";
import UserAvatar from "../../userAvatar/userAvatar";

const MemberProfile = ({ memberId, roomId, onBack, onMessage }) => {
  const [walletAddr, setWalletAddr] = useState("");
  const [displayname, setDisplayname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (memberId && roomId) {
      getProfileInfo();
    }
  }, [memberId, roomId]);

  const getProfileInfo = async () => {
    // const { avatar_url, displayname, wallet_address } = await api._client.getProfileInfo(memberId);
    const room = api._client.getRoom(roomId);
    const member = room?.getMember(memberId);
    if (member) {
      setWalletAddr(member.user?.walletAddress || getAddressByUserId(memberId));
      setAvatarUrl(member.getMxcAvatarUrl() || getDefaultAvatar(memberId));
      setDisplayname(member.user?.displayName || member.name);
    }
  };

  const onClickMessage = async () => {
    const { dm_rooms } = await api._client.findDMRoomByUserId(memberId);
    let nextRoom;
    if (dm_rooms && dm_rooms.length) {
      nextRoom = dm_rooms[0];
    } else {
      // nextRoom = await api.createDMRoom(memberId);
    }
    if (nextRoom === roomId) {
      onBack();
    } else {
      // onMessage(nextRoom);
      api.chatToAddress(getAddressByUserId(memberId))
    }
  }

  return (
    <Styled styles={styles}>
      <div className="memberProfile">
        {/* title */}
        <div className="memberProfile_room_title">
          <div className="memberProfile_room_title_left" onClick={() => onBack()}>
            <img src={roomTitleBackIcon} />
          </div>
          <div className="room_title_center">{formatTextLength(displayname, 30, 15)}</div>
        </div>

        {/* info */}
        <div className="memberProfile_info_wrap">
          {/* avatar */}
          <div className="memberProfile_info" style={{backgroundImage: `url(${setPageAvatarBg})`}}>
            <div className="info_img_box">
              <AvatarComp url={avatarUrl} />
            </div>
            <div className="info_room_station_box"></div>
          </div>
          {/* userName */}
          <p className="memberProfile_alias-label">Display Name</p>
          <div className="memberProfile_alias-text">
            <p>{displayname}</p>
          </div>
          {/* userInfo */}
          <p className="memberProfile_alias-label">Wallet Address</p>
          <div className="memberProfile_userinfo-box-item">
            <p>{walletAddr}</p>
            <CopyToClipboard text={walletAddr} onCopy={(text, result) => {
              if (result) {
                showMessage({
                  msg: 'Copied'
                })
              }
            }}>
              <img src={copyIcon} />
            </CopyToClipboard>
          </div>
          <div className="info-grow"></div>
          <div className="info_btns">
            <div className="info_btns-item" onClick={onClickMessage}>Message</div>
          </div>
        </div>

      </div>
		</Styled>
  );
};

export default MemberProfile;
