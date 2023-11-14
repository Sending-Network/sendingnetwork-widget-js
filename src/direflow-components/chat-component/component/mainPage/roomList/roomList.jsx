import React, { useEffect, useState, useRef } from "react";
import { Styled } from "direflow-component";
import styles from "./roomList.css";
import RoomItem from "../roomItem/roomItem";
import MainMenu from "../mainMenu/mainMenu";
import { mainChatIcon, mobileCloseIcon, searchInputIcon, inviteRoomIcon } from "../../../imgs/index";
import { api } from "../../../api";
import { isMobile, renderAnimation } from "../../../utils";

const RoomList = ({ setRoomListType, rooms, menuFuncs, enterRoom, closeModalms, menuClick }) => {
  const inputRef = useRef(null);
  const roomListRef = useRef(null);
  const [filterStr, setFilterStr] = useState("");
  const [joinRoomList, setJoinRoomList] = useState([])
  const [inviteRoomList, setInviteRoomList] = useState([])

  useEffect(() => {
		renderAnimation(roomListRef.current, 'animate__slideInLeft')
	}, [])
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
    setInviteRoomList(inviteRooms)
    setJoinRoomList(joinRooms)
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
      <div ref={roomListRef} className="rooms widget_animate_invisible">
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
          <div
            className="invite-room"
            onClick={() => setRoomListType('inviteRoomList')}
          >
            <div className="invite-room-left">
              <img src={inviteRoomIcon} />
            </div>
            <div className="invite-room-right">
              <div className="invite-room-right-name">Invitations</div>
              {inviteRoomList.length ? <div className="invite-room-right-count">{inviteRoomList.length}</div> : null}
              {/* <div className="invite-room-right-count">{inviteRoomList.length}</div> */}
            </div>
          </div>
          {joinRoomList.length > 0 ?
            joinRoomList.map((room) => {
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
