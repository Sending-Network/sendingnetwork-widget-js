import React, { useEffect, useState, useRef } from "react";
import { Styled } from "direflow-component";
import styles from "./roomList.css";
import RoomItem from "../roomItem/roomItem";
import MainMenu from "../mainMenu/mainMenu";
import { mainChatIcon, mobileCloseIcon, searchInputIcon } from "../../../imgs/index";
import { api } from "../../../api";
import { isMobile } from "../../../utils";

const RoomList = ({ rooms, menuFuncs, enterRoom, closeModalms, menuClick }) => {
  const inputRef = useRef(null);
  const [filterStr, setFilterStr] = useState("");
  const [list, setList] = useState([]);

  useEffect(() => {
    let fRooms = rooms.filter((r) => {
      const nameStr = String.prototype.toLowerCase.call(r.name || r.calculateName || "");
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

  const handlePlaceholderClick = () => {
    inputRef.current.focus();
  }

  const isShowMenus = () => {
    if (menuFuncs !== undefined && typeof menuFuncs === 'string') {
      return menuFuncs.includes('Invite') || menuFuncs.includes('Settings') || menuFuncs.includes('Logout')
    } else {
      return true;
    }
  }

  return (
    <Styled styles={styles}>
      <div className="rooms">
        <div className="rooms-header">
          <div className="rooms-header-left">Messages</div>
          <div className="rooms-header-right">
            {isShowMenus() && (
              <MainMenu menuFuncs={menuFuncs} closeModalms={closeModalms} menuClick={menuClick} />
            )}
            {isMobile() && (
              <div className="mobile-close-btn" onClick={handleMobileCloseBtn}>
                <img src={mobileCloseIcon} />
              </div>
            )}
          </div>
        </div>
        <div className="rooms-search">
          <div className="search-bar">
            <img className="search-icon" src={searchInputIcon} />
            <input
              ref={inputRef}
              className="filter-box"
              // placeholder=""
              value={filterStr}
              onChange={(e) => setFilterStr(e.target.value)}
              placeholder="Search"
            />
            {/* {!filterStr && <div className="search-placeholder" onClick={handlePlaceholderClick}>
              <span>Search</span>
            </div>} */}
          </div>
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
