import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./msgForward.css";
import { searchInputIcon } from "../../../imgs";
import { backIcon, loadingIcon } from "../../../imgs/svgs";
import { api } from "../../../api";
import ForwardItem from "./forwardItem";

const MsgForward = ({ room, moreOperateMsg, selectedMessages, onBack }) => {
  const [filterStr, setFilterStr] = useState("");
  const [fullList, setFullList] = useState([]);
  const [searchList, setSearchList] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // const users = api._client.getUsers();
    // console.log(users);
    const rooms = api._client.getVisibleRooms();
    console.log(rooms);
    const list = [...rooms].sort((a, b) => { return (a.name || '') > (b.name || '') });
    setFullList(list);
    setSearchList(list);
  }, []);

  useEffect(() => {
    if (filterStr) {
      const arr = [];
      let name;
      let str = filterStr.toLowerCase()
      for (let i = 0; i < fullList.length; i++) {
        name = (fullList[i].name || '').toLowerCase();
        if (name.indexOf(str) > -1) {
          arr.push(fullList[i]);
        }
      }
      setSearchList(arr);
    } else if (fullList && fullList.length) {
      setSearchList(fullList);
    }
  }, [filterStr])

  const handleBackClick = () => {
    for (let i = 0; i < fullList.length; i++) {
      fullList[i].isSelected = false;
    }
    setFilterStr("");
    setFullList([]);
    setSearchList([]);
    setCount(0);
    onBack();
  }

  const handleItemClick = (item) => {
    item.isSelected = !item.isSelected;
    const current = count;
    if (item.isSelected) {
      setCount(current + 1);
    } else {
      setCount(current - 1);
    }
  }

  const handleConfirmClick = async () => {
    setLoading(true);
    for (let i = 0; i < fullList.length; i++) {
      const item = fullList[i];
      if (item.isSelected) {
        await forwardMessages(item.roomId);
      }
    }
    setLoading(false);
    handleBackClick();
  }

  const forwardMessages = async (roomId) => {
    if (selectedMessages.length) {
      const arr = selectedMessages.sort((a, b) => { return (a.viewIndex || 0) - (b.viewIndex || 0) })
      for (let i = 0; i < arr.length; i++) {
        const sdnEvent = arr[i];
        // console.log(sdnEvent);
        await api._client.sendMessage(roomId, sdnEvent.getContent());
      }
    } else if (moreOperateMsg) {
      await api._client.sendMessage(roomId, moreOperateMsg.getContent());
    }
  }

  return (
    <Styled styles={styles}>
      <div className="msg-forward">
        {/* title */}
        <div className="page-title">
          <div className="title_back svg-btn svg-btn-stroke" onClick={handleBackClick}>
            {backIcon}
          </div>
          <div className="title_text">Forward</div>
        </div>

        {/* search */}
        <div className="msg-forward-search">
          <div className="search-bar">
            <img className="search-icon" src={searchInputIcon} />
            <input
              className="filter-box"
              placeholder="Search"
              value={filterStr}
              onChange={(e) => setFilterStr(e.target.value)}
            />
          </div>
        </div>

        {/* list */}
        <div className="list-wrap">
          {
            (searchList).map((item, index) => {
              return <ForwardItem key={index} item={item} handleItemClick={handleItemClick} />
            })
          }
        </div>

        {/* btn */}
        <div className="select-box">
          <div
            className={["select-box-btn", count <= 0 && "select-box-btn_disable"].join(" ")}
            onClick={handleConfirmClick}
          >
            <span>Forward </span>
            {count > 0 && (
              <span> ({count}) </span>
            )}
          </div>
        </div>

        {loading && <div className="loading-modal">
          <div className="loading">
            {loadingIcon}
          </div>
        </div>}
      </div>
    </Styled>
  );
};

export default React.memo(MsgForward);
