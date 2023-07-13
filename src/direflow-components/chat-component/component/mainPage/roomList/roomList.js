import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomList.css";
import RoomItem from "../roomItem/roomItem";
import MainMenu from "../mainMenu/mainMenu";
import { mainChatIcon } from "../../../imgs/index";

const RoomList = ({ rooms, enterRoom, menuClick }) => {
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

  return (
    <Styled styles={styles}>
      <div className="rooms">
        <div className="rooms-header">
          <input
            className="filter-box"
            placeholder="Search"
            value={filterStr}
            onChange={(e) => setFilterStr(e.target.value)}
          />
          <MainMenu menuClick={menuClick} />
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
