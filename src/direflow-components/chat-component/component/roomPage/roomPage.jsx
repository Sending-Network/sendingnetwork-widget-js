import React, { useRef, useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./roomPage.css";
import RoomTitle from "./roomTitle/roomTitle";
import RoomView from "./roomView/roomView";
import RoomProfile from "./roomProfile/roomProfile";
import PinnedMsgCard from "./pinnedMsgCard/pinnedMsgCard";
import InvitePage from "../invitePage/invitePage";
import MemberProfile from "./memberProfile/memberProfile";
import { api } from "../../api";
import WebviewComp from "../webViewComp/webViewComp";
import RoomInput from "./roomView/roomInput/roomInput";
import MultiselectArea from "./multiselectArea/multiselectArea";
import MsgForward from "./msgForward/msgForward";

  const RoomPage = ({ widgetWidth, widgetHeight, roomViewBgUrl, useRoomFuncs, roomId, callback, uploadFile }) => {
  const showMoreThumbsUpEmojiPanelRef = useRef(null)
  const [curRoomId, setCurRoomId] = useState(roomId);
  const [curRoom, setCurRoom] = useState(null);
  const [showWebview, setShowWebview] = useState(false);
  const [webviewUrl, setWebviewUrl] = useState("");
  const [showType, setShowType] = useState('room');
  const [pinnedIds, setPinnedIds] = useState([]); // pinned msg collecions：display in roomPage Com，open in roomView Com，close in roomPage Com
  const [moreOperateMsg, setMoreOperateMsg] = useState(null); // msg which is operating ：display in roominput Com(reply/edit)/display in roomPage Com(delete)，seting in messageItem Com
  const [showReplyOrEditMsgDialog, setShowReplyOrEditMsgDialog] = useState(''); // whether display replied/edited msg dialog：diaplay in roominput Com，open in messageItem Com，close in roomInput Com
  const [inputFocus, setInputFocus] = useState(false); // focus roomInput Com
  const [showMsgDeleteDialog, setShowMsgDeleteDialog] = useState(false) // whether display deleteing msg submit dialog，display in roomPage Com，open in messageItem Com，close in roomPage Com
  const [closeEmoji, setCloseEmoji] = useState('');
  const [memberProfileId, setMemberProfileId] = useState("");
  const [isDMRoom, setIsDMRoom] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false); // whether display context menu when ringht click one msg
  const [showMoreThumbsUpEmojiPanel, setShowMoreThumbsUpEmojiPanel] = useState(false); // whether display more thumbup emojis panel dialog
  const [showCheckbox, setShowCheckbox] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [delStamp, setDelStamp] = useState('') // fix roomView com doesn't update instance afete delete msg operatiob

  useEffect(() => {
    if (curRoomId) {
      initRoomData(curRoomId);
    }
  }, [curRoomId])

  const initRoomData = (roomId) => {
    const room = api._client.getRoom(roomId);
        const isDm = room.isDmRoom();
    setIsDMRoom(isDm);
    if (room) {
      const events = room.getLiveTimeline().getEvents();
      if (events.length) {
        api._client.sendReadReceipt(events[events.length - 1]);
      }
      initPinnedEvent(room)
      setCurRoom(room)
    }
  }

  const initPinnedEvent = (room) => {
    const pinnedList = room?.currentState?.getStateEvents("m.room.pinned_events", "")?.getContent().pinned || [];
    setPinnedIds(pinnedList)
  }

  const openUrlPreviewWidget = (url) => {
    setShowWebview(true);
    setWebviewUrl(url);
  };

  const onBack = () => {
    const room = api._client.getRoom(curRoomId);
    if (room) {
      const events = room.getLiveTimeline().getEvents();
      if (events.length) {
        api._client.sendReadReceipt(events[events.length - 1]);
      }
    }
    setCurRoomId("");
    setCurRoom(null);
    callback();
  }

  const handleProfileBack = (type) => {
    switch (type) {
      case 'leaved': onBack();
        break;
      case 'invite': setShowType('invite');
        break;
      default: setShowType('room');
        break;
    }
  }

  const pinnedCloseClick = async () => { // cancle pinned msg
    await api._client.sendStateEvent(curRoomId, 'm.room.pinned_events', { pinned: [] }, "");
    setPinnedIds([]);
  }

  const pinEventSync = (eventData) => {
    const { content: { pinned } } = eventData;
    setPinnedIds(pinned);
  }

  const handleSureDeleteMsg = async (e) => { // handle delete msg submit
    const reason = 'bad message must delete'
    setShowMsgDeleteDialog(false)
    try {
      // this.props.onCloseDialog?.();
      await api._client.redactEvent(
        curRoomId,
        moreOperateMsg.getId(),
        undefined,
        reason ? { reason } : {}
      );
      // const room = api._client.getRoom(roomId);
      // const events = room.getLiveTimeline().removeEvent(moreOperateMsg.getId());
      setDelStamp(Math.random())
    } catch (e) {
      console.error('error: ', e)
      const code = e.errcode || e.statusCode;
      // only show the dialog if failing for something other than a network error
      // (e.g. no errcode or statusCode) as in that case the redactions end up in the
      // detached queue and we show the room status bar to allow retry
      if (typeof code !== "undefined") {
        // display error message stating you couldn't delete this.
        // Modal.createTrackedDialog(
        //     "You cannot delete this message",
        //     "",
        //     ErrorDialog,
        //     {
        //         title: _t("Error"),
        //         description: _t(
        //             "You cannot delete this message. (%(code)s)",
        //             { code }
        //         ),
        //     }
        // );
        alert('You cannot delete this message.')
      }
    }
  }

  const memberAvatarClick = (id) => {
    setMemberProfileId(id);
    setShowType('memberProfile');
  }

  const startSelect = (sdnEvent) => {
    if (sdnEvent && sdnEvent.event) {
      onCheckChanged(sdnEvent, true);
    }
    setShowCheckbox(true);
  }

  const stopSelect = () => {
    for (let i = 0; i < selectedMessages.length; i++) {
      selectedMessages[i].checked = false;
    }
    setSelectedMessages([]);
    setShowCheckbox(false);
  }

  const onCheckChanged = (sdnEvent, checked) => {
    if (checked) {
      setSelectedMessages((arr) => [sdnEvent, ...arr]);
    } else {
      setSelectedMessages((arr) => arr.filter((value) => {
        return value.getId() !== sdnEvent.getId();
      }));
    }
  }

  const setShowForward = () => {
    setShowType('forward');
  }

  const closeMoreWrap = (evt) => {
    if (evt.target === showMoreThumbsUpEmojiPanelRef?.current) return
    // e.stopPropagation();
    setShowMoreMenu(false);
    setShowMoreThumbsUpEmojiPanel(false);
  }

  return (
    <Styled styles={styles}>
      <div className="roomPage" onClick={() => { setCloseEmoji(new Date().getTime()) }}>
        {showType === 'profile' && <RoomProfile room={curRoom} isDMRoom={isDMRoom} backClick={handleProfileBack} memberClick={memberAvatarClick} onLeave={onBack} />}
        {showType === 'invite' && <InvitePage title="Invite User" roomId={curRoomId} onBack={() => setShowType('room')} />}
        {showType === 'memberProfile' && <MemberProfile memberId={memberProfileId} roomId={curRoomId} onBack={() => {
          setMemberProfileId("");
          setShowType('room');
        }} onMessage={(roomId) => {
          setMemberProfileId("");
          setShowType('room');
          setCurRoomId(roomId);
          initRoomData(roomId);
        }} />}
        {showType === 'forward' && <MsgForward
          room={curRoom}
          moreOperateMsg={moreOperateMsg}
          selectedMessages={selectedMessages}
          onBack={() => { setShowType('room'); stopSelect(); }}
        />}
        {showType === 'room' && (
          <div className="chat_widget_room_page" onClickCapture={closeMoreWrap}>
            <RoomTitle room={curRoom} onBack={onBack} setClick={() => setShowType('profile')} />
            {pinnedIds.length > 0 && (
              <PinnedMsgCard
                roomId={curRoomId}
                pinnedIds={pinnedIds}
                pinnedCloseClick={pinnedCloseClick}
              />
            )}
            <RoomView
              widgetWidth={widgetWidth}
              widgetHeight={widgetHeight}
              roomViewBgUrl={roomViewBgUrl}
              useRoomFuncs={useRoomFuncs}
              roomId={curRoomId}
              openUrlPreviewWidget={openUrlPreviewWidget}
              pinnedIds={pinnedIds}
              setPinnedIds={setPinnedIds}
              pinEventSync={pinEventSync}
              moreOperateMsg={moreOperateMsg}
              setMoreOperateMsg={setMoreOperateMsg}
              setShowReplyOrEditMsgDialog={setShowReplyOrEditMsgDialog}
              inputFocus={inputFocus}
              setInputFocus={setInputFocus}
              showMoreThumbsUpEmojiPanelRef={showMoreThumbsUpEmojiPanelRef}
              showMoreMenu={showMoreMenu}
              setShowMoreMenu={setShowMoreMenu}
              showMoreThumbsUpEmojiPanel={showMoreThumbsUpEmojiPanel}
              setShowMoreThumbsUpEmojiPanel={setShowMoreThumbsUpEmojiPanel}
              setShowMsgDeleteDialog={setShowMsgDeleteDialog}
              showMsgDeleteDialog={showMsgDeleteDialog}
              delStamp={delStamp}
              memberAvatarClick={memberAvatarClick}
              showCheckbox={showCheckbox}
              onStartSelect={startSelect}
              onCheckChanged={onCheckChanged}
              setShowForward={setShowForward}
            />
            {curRoom ? <RoomInput
              room={curRoom}
              useRoomFuncs={useRoomFuncs}
              moreOperateMsg={moreOperateMsg}
              showReplyOrEditMsgDialog={showReplyOrEditMsgDialog}
              inputFocus={inputFocus}
              setShowReplyOrEditMsgDialog={setShowReplyOrEditMsgDialog}
              openUrlPreviewWidget={openUrlPreviewWidget}
              closeEmoji={closeEmoji}
              showCheckbox={showCheckbox}
              uploadFile={uploadFile}
            /> : null}
            {showCheckbox ? <MultiselectArea
              room={curRoom}
              selectedMessages={selectedMessages}
              onStopSelect={stopSelect}
              setShowForward={setShowForward}
            /> : null}

            {/* delete msg dialog */}
            {showMsgDeleteDialog && (
              <div className="msg_delete_dialog">
                <div className="msg_delete_dialog_content">
                  <div className="info">
                    Are you sure you want to delete<br /> this message ?
                  </div>
                  <div className="btns">
                    <div className="btns-item btns-cancel" onClick={() => setShowMsgDeleteDialog(false)}>Cancel</div>
                    <div className="btns-item btns-confirm" onClick={handleSureDeleteMsg}>Delete</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* webview Comp */}
        {showWebview && (
          <WebviewComp
            url={webviewUrl}
            closeUrlPreviewWidget={() => setShowWebview(false)}
          />
        )}
      </div>
    </Styled>
  );
};

export default RoomPage;
