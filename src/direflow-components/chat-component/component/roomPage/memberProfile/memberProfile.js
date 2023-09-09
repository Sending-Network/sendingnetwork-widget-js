import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./memberProfile.css";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { api } from "../../../api";
import { roomTitleBackIcon, copyIcon, setPageAvatarBg } from "../../../imgs/index";
import { showToast, formatTextLength } from "../../../utils/index";
import { AvatarComp } from "../../avatarComp/avatarComp";

const MemberProfile = ({ memberId, onBack }) => {
  const [walletAddr, setWalletAddr] = useState("");
  const [displayname, setDisplayname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    getProfileInfo();
  }, [memberId]);

  const getProfileInfo = async () => {
    const { avatar_url, displayname, wallet_address } = await api._client.getProfileInfo(memberId);
    setWalletAddr(wallet_address);
    setAvatarUrl(avatar_url);
    setDisplayname(displayname);
  };

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
          <div className="memberProfile_alias-text">{displayname}</div>
          {/* userInfo */}
          <p className="memberProfile_alias-label">Wallet Address</p>
          <div className="memberProfile_userinfo-box-item">
            <p>{walletAddr}</p>
            <CopyToClipboard text={walletAddr} onCopy={(text, result) => {
              if (result) {
                showToast({
                  type: 'success',
                  msg: 'Copied',
                })
              }
            }}>
              <img src={copyIcon} />
            </CopyToClipboard>
          </div>
        </div>

      </div>
		</Styled>
  );
};

export default MemberProfile;
