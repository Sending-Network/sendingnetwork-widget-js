import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomList.css";
import RoomItem from "../roomItem/roomItem";
import MainMenu from "../mainMenu/mainMenu";
import { mainChatIcon, mobileCloseIcon, searchInputIcon } from "../../../imgs/index";
import { api } from "../../../api";
import { isMobile } from "../../../utils";

const RoomList = ({ rooms, enterRoom, closeModalms, menuClick }) => {
  const [filterStr, setFilterStr] = useState("");
  const [list, setList] = useState([]);

  useEffect(() => {
    let fRooms = rooms.filter(({ calculateName }) => {
      const nameStr = String.prototype.toLowerCase.call(calculateName || "");
      const fltStr = String.prototype.toLowerCase.call(filterStr);
      return nameStr.indexOf(fltStr) !== -1;
    });
    const inviteRooms = fRooms.filter((room) => {
      return room.getMyMembership() === "invite";
    });
    const joinRooms = fRooms.filter((room) => {
      return room.getMyMembership() === "join";
    });
    setList([...inviteRooms, ...joinRooms])
  }, [rooms, filterStr]);

  const handleMobileCloseBtn = () => {
    api.showWidget(false);
  }

  return (
    <Styled styles={styles}>
      <div className="rooms">
        <div className="rooms-header">
          <div className="rooms-header-left">SendingNetwork</div>
          <div className="rooms-header-right">
            <MainMenu closeModalms={closeModalms} menuClick={menuClick} />
            {isMobile() && (
              <div className="mobile-close-btn" onClick={handleMobileCloseBtn}>
                <img src={mobileCloseIcon} />
              </div>
            )}
          </div>
        </div>
        <div className="rooms-search">
          <input
            className="filter-box"
            placeholder="Search"
            value={filterStr}
            onChange={(e) => setFilterStr(e.target.value)}
          />
          {!filterStr && <img className="rooms-search-icon" src={searchInputIcon} />}
        </div>
        <div className="rooms-list">
          {list.length > 0 ? 
            list.map((room) => {
              return <RoomItem key={room.roomId} room={room} enterRoom={enterRoom} />
            })
           : (
            <div className="rooms-list_noData">
              <img src={mainChatIcon} />
              <p>Tap 'New Chat' in the right corner to connect<br />instantly. Send messages to any wallets</p>
            </div>
          )}
        </div>
      </div>
    </Styled>
  );
};

export default RoomList;
