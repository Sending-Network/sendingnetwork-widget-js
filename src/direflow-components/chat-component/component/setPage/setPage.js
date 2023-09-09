import React, { useEffect, useState, useRef } from "react";
import { Styled } from "direflow-component";
import styles from "./setPage.css";
import { api } from "../../api";
import { roomTitleBackIcon, copyIcon, setPageAvatarBg } from "../../imgs/index";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { showToast } from "../../utils/index";
import { AvatarComp } from "../avatarComp/avatarComp";

const SetPage = ({ onBack }) => {
  const [walletAddr, setWalletAddr] = useState("");
  const [displayname, setDisplayname] = useState("");
  const [oldDisplayName, setOldDisplayname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const uploadRef = useRef(null);

  useEffect(() => {
    getProfileInfo();
  }, []);

  const getProfileInfo = async () => {
    const userId = api.getUserId();
    const { avatar_url, displayname, wallet_address } = await api._client.getProfileInfo(userId);
    setWalletAddr(wallet_address);
    setAvatarUrl(avatar_url);
    setOldDisplayname(displayname);
    setDisplayname(displayname);
  };

  const handleSave = async () => {
    if (!displayname) {
      showToast({
        type: "info",
        msg: "the display name not allow null",
      });
    } else {
      if (displayname !== oldDisplayName) {
        await api._client.setDisplayName(displayname);
        getProfileInfo();
      }
      showToast({
        type: "success",
        msg: "Success",
      });
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    try {
      const url = await api._client.uploadContent(file);
      await api._client.setAvatarUrl(url);
      getProfileInfo();
      showToast({
        type: "success",
        msg: "Success",
      });
    } catch (error) {
      showToast({
        type: "error",
        msg: error,
      });
    }
    uploadRef.current.value = "";
  };

  return (
    <Styled styles={styles}>
      <div className="setPage">
        {/* title */}
        <div className="setPage_room_title">
          <div className="setPage_room_title_left" onClick={() => onBack()}>
            <img src={roomTitleBackIcon} />
          </div>
          <div className="room_title_center">Settings</div>
        </div>

        {/* content */}
        <div className="setPage_content" style={{backgroundImage: `url(${setPageAvatarBg})`}}>
          {/* avatar */}
          <div className="setPage_content_avatar" onClick={() => uploadRef.current.click()}>
            <AvatarComp url={avatarUrl} />
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: "none" }}
            />
          </div>
        
          {/* info  */}
          <div className="setPage_content_info">
            {/* userName */}
            <p className="alias-label">Display Name</p>
            <input
              className="alias-input"
              value={displayname}
              onChange={(e) => setDisplayname(e.target.value)}
            />
            {/* userInfo */}
            <p className="alias-label">Wallet Address</p>
            <div className="alias-address">
              <p>{walletAddr}</p>
              <CopyToClipboard
                text={walletAddr}
                onCopy={(text, result) => {
                  if (result) {
                    showToast({
                      type: "success",
                      msg: "Copied",
                    });
                  }
                }}>
                <img src={copyIcon} />
              </CopyToClipboard>
            </div>
          </div>

          
        </div>

        {/* btn */}
        <div className="btns-box" onClick={handleSave}>
          Save
        </div>
      </div>
    </Styled>
  );
};

export default SetPage;
