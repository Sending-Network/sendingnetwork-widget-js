import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import { CopyToClipboard } from "react-copy-to-clipboard";
import styles from "./shareComp.css";
import { api } from "../../api";
import {
  roomTitleBackIcon,
  webviewShareTwitterIcon,
  webviewShareTelegramIcon,
  webviewShareDiscordIcon,
  webviewShareLinkIcon,
  searchInputIcon,
  inviteSelectedIcon,
  inviteUnselectIcon
} from "../../imgs/index";
import { formatTextLength, showToast } from "../../utils/index";
import { AvatarComp } from "../avatarComp/avatarComp";
import RoomAvatar from "../roomAvatar/roomAvatar";

const ShareComp = ({ link, onBack }) => {
  const [filterStr, setFilterStr] = useState("");
  const [roomsList, setRoomsList] = useState([]);
  const [searchList, setSearchList] = useState([]);
  const [selectList, setSelectList] = useState([]);

  useEffect(() => {
    const rooms = api._client.getRooms();
    const joinRooms = [];
    rooms.map(room => {
      if (room.getMyMembership() === "join") {
        room.isSelected = false;
        joinRooms.push(room);
      }
    })
    setRoomsList(joinRooms);
    setSearchList(joinRooms);
  }, [])

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    if (!newVal) {
      setSearchList(roomsList);
    }
    const filteredArr = roomsList.filter(room => {
      const str = String.prototype.toLowerCase.apply(newVal || '');
      const roomName = String.prototype.toLowerCase.apply(room.name || room.calculateName || '');
      return roomName.indexOf(str) !== -1;
    })
    setFilterStr(newVal);
    setSearchList(filteredArr);
  }

  const handleSearchListClick = (room) => {
    const resultList = [];
    const choosedList = [];
    searchList.map(item => {
      if (item.roomId === room.roomId) {
        item.isSelected = !item.isSelected
      }
      resultList.push(item);
      if (item.isSelected) {
        choosedList.push(item);
      }
    })
    setSearchList(resultList);
    setSelectList(choosedList)
  }

  const handleConfirmClick = async () => {
    if (selectList.length <= 0) return;
    await selectList.map(room => {
      api._client.sendEvent(
        room.roomId,
        "m.room.message",
        {
          body: link,
          msgtype: "m.text",
        },
        ""
      );
    })
    showToast({ type: "success", msg: "success" });
    const newList = roomsList.map(room => {
      room.isSelected = false;
      return room;
    });
    setFilterStr('');
    setSearchList(newList);
    setSelectList([]);
  }

  const hanleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${link}`;
    window.open(url);
  }

  const hanleTelegramShare = () => {
    const url = `https://telegram.me/share/url?url=${link}`;
    window.open(url);
  }

  const hanleDiscordShare = () => {
    const url = `https://discord.com/channels/@me?url=${link}`;
    window.open(url);
  }

  return (
    <Styled styles={styles}>
      <div className="widget_shareComp">
        {/* title */}
        <div className="shareComp_title">
          <div className="shareComp_title_left" onClick={() => onBack()}>
            <img src={roomTitleBackIcon} />
          </div>
          <div className="shareComp_title_center">Share to</div>
        </div>
        {/* app share */}
        <div className="shareComp_app">
          <div className="shareComp_app_item" onClick={hanleTwitterShare}>
            <div className="shareComp_app_item_img twitter_bg">
              <img src={webviewShareTwitterIcon} />
            </div>
            <span className="shareComp_app_item_text">Twitter</span>
          </div>
          <div className="shareComp_app_item" onClick={hanleTelegramShare}>
            <div className="shareComp_app_item_img telegram_bg">
              <img src={webviewShareTelegramIcon} />
            </div>
            <span className="shareComp_app_item_text">Telegram</span>
          </div>
          <div className="shareComp_app_item" onClick={hanleDiscordShare}>
            <div className="shareComp_app_item_img discord_bg">
              <img src={webviewShareDiscordIcon} />
            </div>
            <span className="shareComp_app_item_text">Discord</span>
          </div>
          <div className="shareComp_app_item">
            <CopyToClipboard
              text={link}
              onCopy={(text, result) => {
                if (result) {
                  showToast({
                    type: "success",
                    msg: "Copied",
                  });
                }
              }}>
              <div className="shareComp_app_item_img link_bg">
                <img src={webviewShareLinkIcon} />
              </div>
            </CopyToClipboard>
            <span className="shareComp_app_item_text">Copy Link</span>
          </div>
        </div>
        {/* search */}
        <div className="shareComp_search">
          <div className="search-bar">
            <img className="search-icon" src={searchInputIcon} />
            <input
              className="filter-box"
              placeholder="Search"
              value={filterStr}
              onChange={(e) => handleInputChange(e)}
            />
          </div>
        </div>
        {/* list */}
        <div className="list-wrap">
          {
            searchList.map(room => {
              return (
                <div className="members_item" key={room.roomId} onClick={() => handleSearchListClick(room)}>
                  <div className="members_item_select">
                    <img src={room.isSelected ? inviteSelectedIcon : inviteUnselectIcon} />
                  </div>
                  <div className="members_item_avatar">
                    <RoomAvatar room={room} />
                    {/* <AvatarComp url={room.avatar_url} /> */}
                  </div>
                  <div className="members_item_desc">
                    <p className="members_item_desc_name">{room.name || room.calculateName}</p>
                    <p className="members_item_desc_addr">{room.roomId}</p>
                  </div>
                </div>
              )
            })
          }
        </div>
        {/* btn */}
        <div className="select-box">
          <div
            className={["select-box-btn", selectList.length <= 0 && "select-box-btn_disable"].join(" ")}
            onClick={handleConfirmClick}
          >
            <span>Share </span>
            {selectList.length > 0 && (
              <span> ({selectList.length}) </span>
            )}
          </div>
        </div>
      </div>
    </Styled>
  );
};

export default ShareComp;
