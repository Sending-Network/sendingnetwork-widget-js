import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomList.css";
import RoomItem from "../roomItem/roomItem";

const RoomList = ({ rooms, myUserData, enterRoom }) => {
  const [filterStr, setFilterStr] = useState("");
  const [list, setList] = useState([]);

  useEffect(() => {
    let fRooms = rooms.filter(({ name }) => name.indexOf(filterStr) !== -1);
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
          {list.map((room) => {
            return <RoomItem key={room.roomId} room={room} enterRoom={enterRoom} myUserData={myUserData} />
          })}
        </div>
      </div>
    </Styled>
  );
};

export default RoomList;
