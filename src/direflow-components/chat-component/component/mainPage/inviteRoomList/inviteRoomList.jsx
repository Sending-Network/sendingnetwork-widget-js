import React, { useEffect, useState, useRef } from "react";
import { Styled } from "direflow-component";
import styles from "./inviteRoomList.css";
import InviteRoomItem from "../inviteRoomItem/inviteRoomItem";
import { mainChatIcon } from "../../../imgs/index";
import { backIcon, editIcon } from "../../../imgs/svgs";
import { api } from "../../../api"; 
import { isMobile, showToast, renderAnimation} from "../../../utils";
import { FLATTENABLE_KEYS } from "@babel/types";

const RoomList = ({ setRoomListType, rooms, menuFuncs, closeModalms, menuClick }) => {
  const inviteRoomListRef = useRef(null)
  const [filterStr, setFilterStr] = useState("");
  const [joinRoomList, setJoinRoomList] = useState([])
  const [inviteRoomList, setInviteRoomList] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [selectedInvite, setSelectedInvite] = useState([])

  useEffect(() => {
    inviteRoomListRef.current && renderAnimation(inviteRoomListRef.current, 'animate__slideInRight')
  }, []);
  useEffect(() => {
    let fRooms = rooms.filter((r) => {
      const nameStr = String.prototype.toLowerCase.call(r.name || r.calculateName || "");
      const fltStr = String.prototype.toLowerCase.call(filterStr);
      return nameStr.indexOf(fltStr) !== -1;
    });
    const inviteRooms = fRooms.filter((room) => {
      return room.getMyMembership() === "invite";
    });
    setInviteRoomList(inviteRooms)
  }, [rooms, filterStr]);

  const onCheckChanged = (room, checked) => {
    if (checked) {
      setSelectedInvite((arr) => [room, ...arr]);
    } else {
      setSelectedInvite(arr => arr.filter(item =>  item.roomId !== room.roomId));
    }
  }

  const changeEditStatus = (editStatus = !isEditing) => { // invoked when edit status has changed
    if (inviteRoomList.length === 0) return
    if (!editStatus) { // cancel edit
      for (let i = 0; i < selectedInvite.length; i++) {
        selectedInvite[i].checked = false;
      }
      setSelectedInvite([]);
    }
    setIsEditing(editStatus)
  }

  const goBackRoomList = () => { // go back roomlist page
    changeEditStatus(false)
    setRoomListType('roomList')
  }

  const acceptInvite = async (roomId) => { // accept one invite
    console.log(111)
    await api.joinRoom(roomId, () => {
      showToast({
        type: 'success',
        msg: 'Invitation accepted',
      })
    });
    console.log(333)
  };

  const rejectInvite= (roomId) => { // reject one invite
    api.leave(roomId, () => {
      showToast({
        type: 'none',
        msg: 'Invitation rejected',
      })
    });
  };

  const acceptMutipleSelectedInvite = async () => { // accept mutiple selected invite
    await Promise.all(selectedInvite.map(room => api.joinRoom(room.roomId)))
    showToast({
      type: 'success',
      msg: 'Invitations accepted',
    })
  }

  const rejectMutipleSelectedInvite = async () => { // reject mutiple selected invite
    await Promise.all(selectedInvite.map(room => api.leave(room.roomId)))
    showToast({
      type: 'none',
      msg: 'Invitations rejected',
    })
  }

  return (
    <Styled styles={styles}>
      <div ref={inviteRoomListRef} className="invite widget_animate_invisible">
        <div className="invite-header">
          <div className="svg-btn svg-btn-stroke invite-header-left" onClick={() => goBackRoomList()}>
            {backIcon}
            <div className="invite-header-title">Invitations</div>
          </div>
          {<div className={`svg-btn svg-btn-stroke invite-header-right ${isEditing && 'editing'}`} onClick={() => changeEditStatus()}>
            {editIcon}
          </div>}
        </div>
        <div className="invite-list">
          {inviteRoomList.length > 0 ?
            inviteRoomList.map((room) => {
              return <InviteRoomItem
                key={room.roomId}
                room={room}
                isEditing={isEditing}
                onCheckChanged={onCheckChanged}
                acceptInvite={acceptInvite}
                rejectInvite={rejectInvite}
              />
            })
            : (
              <div className="invite-list-noData">
                <img src={mainChatIcon} />
                <p>There's no invitation at this moment</p>
              </div>
            )}
        </div>

        {/* btns */}
        {isEditing && (
          <div className={`invite-box ${selectedInvite.length === 0 && 'invalid'}`}>
            <div
              className="invite-box-btn reject"
              onClick={() => rejectMutipleSelectedInvite(false)}
            >Reject</div>
            <div
              className="invite-box-btn accept"
              onClick={() => acceptMutipleSelectedInvite()}
            >Accept</div>
          </div>
        )}
      </div>
    </Styled>
  );
};

export default RoomList;
