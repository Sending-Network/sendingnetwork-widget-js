import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomList.css";
import RoomItem from "../roomItem/roomItem";

const RoomList = ({ rooms, myUserData, enterRoom }) => {
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
        <input
          className="filter-box"
          placeholder="Search"
          value={filterStr}
          onChange={(e) => setFilterStr(e.target.value)}
        />
        <div className="rooms-list">
          {list.length > 0 ? 
            list.map((room) => {
              return <RoomItem key={room.roomId} room={room} enterRoom={enterRoom} />
            })
           : (
            <div className="rooms-list_noData">there's no room yet</div>
          )}          
        </div>
      </div>
    </Styled>
  );
};

export default RoomList;
