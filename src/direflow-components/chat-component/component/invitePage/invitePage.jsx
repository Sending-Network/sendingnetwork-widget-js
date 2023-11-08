import React, { useCallback, useEffect, useRef, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./invitePage.css";
import {
  inviteSelectedIcon,
  inviteUnselectIcon,
  dialogLoadingIcon,
  searchInputIcon
} from "../../imgs/index"
import { backIcon, closeIcon } from "../../imgs/svgs";
import { api } from "../../api";
import { formatTextLength, showToast, getAddressByUserId, getMemberName } from "../../utils/index";
import InputDialogComp from "../inputDialogComp/inputDialogComp";
import { AvatarComp } from "../avatarComp/avatarComp";
import UserAvatar from "../userAvatar/userAvatar";

const InvitePage = ({ roomId, onBack, title }) => {
  const inputRef = useRef(null);
  const [filterStr, setFilterStr] = useState("");
  const [searchList, setSearchList] = useState([]);
  const [selectList, setSelectList] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogStatus, setDialogStatus] = useState('loading');
  const [dialogText, setDialogText] = useState("");
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [currId, setCurrId] = useState(0);

  useEffect(() => {
    if (!filterStr) {
      setSearchList([]);
    } else {
      // let tmpStr = filterStr;
      // if (/^0[x|X]./g.test(tmpStr)) {
      //   const tmpStrArr = tmpStr.match(/^0[x|X](.+)/);
      //   tmpStr = tmpStrArr[1] || tmpStr;
      // }
      if (currId) {
        clearTimeout(currId);
      }
      const id = setTimeout(() => {
        applySearch(filterStr);
      }, 300);
      setCurrId(id);
    }
  }, [filterStr]);

  const applySearch = (term) => {
    api._client.searchUserDirectory({
      term: term,
      limit: 10
    }).then((resp) => {
      if (resp && resp.results && resp.results.length > 0) {
        const tmpArr = resp.results.map(item => {
          return {
            ...item,
            isSelected: isSearchUserSelected(item)
          }
        })
        setSearchList(tmpArr)
      }
    }).catch(err => {
      setSearchList([])
    })
  }

  const isSearchUserSelected = (user) => {
    const isSelect = selectList.find(u => u.user_id === user.user_id);
    return isSelect ? true : false;
  }

  const handleBackClick = () => {
    setFilterStr("")
    setSelectList([])
    setSearchList([])
    onBack()
  }

  const handleSelectListClick = (user) => {
    const arr = JSON.parse(JSON.stringify(selectList));
    const index = arr.findIndex(v => v.user_id === user.user_id);
    arr.splice(index, 1);
    setSelectList(arr);
  }

  const handleSearchListClick = (user) => {
    const arr = JSON.parse(JSON.stringify(selectList));
    const arrSearch = JSON.parse(JSON.stringify(searchList));
    const index = arr.findIndex(v => v.user_id === user.user_id);
    const indexSearch = arrSearch.findIndex(v => v.user_id === user.user_id);

    if (index !== -1) {
      arr.splice(index, 1)
    } else {
      arr.push({
        ...user,
        isSelected: true
      })
      setFilterStr('');
      if (inputRef && inputRef.current) {
        inputRef.current.focus();
      }
    }
    arrSearch.splice(indexSearch, 1, {
      ...user,
      isSelected: !user.isSelected
    });
    setSelectList(arr);
    setSearchList(arrSearch);
  }

  const handleConfirmClick = async () => {
    if (selectList.length <= 0) return;
    if (roomId) {
      handleCreateAndInvite(roomId);
    } else {
      // single person not show dialog
      if (selectList.length === 1) {
        const targetId = selectList[0].user_id;
        api.chatToAddress(getAddressByUserId(targetId));
      } else {
        setShowInputDialog(true);
      }
    }
  }

  const handleCreateAndInvite = async (roomId, roomName) => {
    setDialogStatus('loading');
    setShowDialog(true);
    let tmpRoomId = roomId;
    let created = false;
    if (!tmpRoomId) {
      if (selectList.length > 1) {
        tmpRoomId = await api.createPublicRoom(roomName);
      } else {
        tmpRoomId = await api.createDMRoom(selectList[0]);
      }
      created = true;
    }
    await checkRoomExist(tmpRoomId);
    const room = api._client.getRoom(tmpRoomId);
    let inviteCount = 0;
    await selectList.map(m => {
      const member = room.getMember(m.user_id);
      if (member == null || member.membership !== 'join') {
        api.invite(tmpRoomId, m.user_id);
        inviteCount++;
      }
    });
    if (inviteCount) {
      if (created) {
        setDialogText('The room is created successfully!');
        window.joinToPublicRoomWatch(tmpRoomId);
      } else {
        setDialogText(`${inviteCount > 1 ? 'Invitations' : 'Invitation'} sent`);
      }
    } else {
      if (selectList.length > 1) {
        setDialogText('These members are already part of the group');
      } else {
        setDialogText('This member is already part of the group');
      }
    }
    setDialogStatus('success');
  }

  const checkRoomExist = async (_roomId) => {
    await new Promise((resolve, reject) => {
      const hasRoomInterval = setInterval(() => {
        const room = api._client.getRoom(_roomId);
        console.log('widget__interval', room);
        if (room) {
          clearInterval(hasRoomInterval);
          resolve('wasm live: success');
        }
      }, 100)
    })
  }

  const spawnInvitedUserItem = (list) => {
    const arr = [];
    for (let i = 0; i < list.length; i++) {
      const user = list[i];
      arr.push(<span className="invited-item" key={user.user_id}>
        <span className="invited-user">
          <span className="avatar">
            <UserAvatar user={user} />
          </span>
          <span className="name">{user.display_name}</span>
        </span>
        <div className="btn-close svg-btn svg-btn-fill" onClick={()=>{handleSelectListClick(user)}}>{closeIcon}</div>
      </span>)
    }
    return arr
  }

  return (
    <Styled styles={styles}>
      <div className="invite_page">
        {/* title */}
        <div className="invite_page_title">
          <div className="title_back svg-btn svg-btn-stroke" onClick={handleBackClick}>
            {backIcon}
          </div>
          <div className="title_text">{title || "New Chat"}</div>
        </div>

        {/* search */}
        <div className="invite_page-search">
          <div className="search-bar">
            {selectList.length ? spawnInvitedUserItem(selectList) : <img className="search-icon" src={searchInputIcon} />}
            <input
              ref={inputRef}
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
            (searchList).map(item => {
              return (
                <div className="members_item" key={item.user_id} onClick={() => {
                  handleSearchListClick(item)
                }}>
                  <div className="members_item_select">
                    <img src={item.isSelected ? inviteSelectedIcon : inviteUnselectIcon} />
                  </div>
                  <div className="members_item_avatar">
                    <UserAvatar user={item} />
                    {/* <AvatarComp url={item.avatar_url} /> */}
                  </div>
                  <div className="members_item_desc">
                    <p className="members_item_desc_name">{item.display_name}</p>
                    <p className="members_item_desc_addr">{getAddressByUserId(item.user_id)}</p>
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
            <span>Selected </span>
            {selectList.length > 0 && (
              <span> ({selectList.length}) </span>
            )}
          </div>
        </div>

        {/* dialog */}
        {showDialog && (
          <div className="invite_page_dialog">
            <div className="invite_page_dialog_content">
              <div className="info">
                {dialogStatus === 'loading' && (
                  <div className="invite_page_dialog_loading">
                    <img src={dialogLoadingIcon} />
                    <span>Processing...</span>
                  </div>
                )}
                {dialogStatus === 'success' && (<p className="info-desc">{dialogText}</p>)}
              </div>
              {dialogStatus === 'success' && (<div className="btns" onClick={handleBackClick}>Ok</div>)}
            </div>
          </div>
        )}

        {/* input-dialog */}
        {showInputDialog && (
          <InputDialogComp
            title='Set Room Name'
            value=''
            callback={(type, text) => {
              setShowInputDialog(false);
              if (type === 'confirm') {
                handleCreateAndInvite(null, text);
              }
            }}
          />
        )}
      </div>
    </Styled>
  );
};

export default InvitePage;
