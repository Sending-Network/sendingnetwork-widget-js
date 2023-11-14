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
import { renderAnimation } from "../../utils/index";
import { TimelineWindow } from "sendingnetwork-js-sdk"

const RoomPage = ({ widgetWidth, widgetHeight, roomViewBgUrl, useRoomFuncs, roomId, callback, uploadFile }) => {
  const roomPageRef = useRef(null)
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
  const [timelineWindow, setTimelineWindow] = useState(null);
  const [focusEventId, setFocusEventId] = useState('');

  useEffect(() => {
    if (curRoomId) {
      initRoomData(curRoomId);
    }
  }, [curRoomId])

  useEffect(() => {
    setTimeout(() => {
      roomPageRef.current && renderAnimation(roomPageRef.current, 'animate__slideInRight')
    }, 20)
  }, []);

  const initRoomData = (roomId) => {
    const room = api._client.getRoom(roomId);
    const isDm = room.isDmRoom();
    setIsDMRoom(isDm);
    if (room) {
      initPinnedEvent(room);
      setCurRoom(room);
      const set = room.getUnfilteredTimelineSet();
      const win = new TimelineWindow(api._client, set);
      const events = room.getLiveTimeline().getEvents();
      if (events.length) {
        const lastEvent = events[events.length - 1];
        api._client.sendReadReceipt(lastEvent);
      }
      win.load(null, 20);
      setTimelineWindow(win);
    }
  }

  const initPinnedEvent = (room) => {
    const pinnedList = room?.currentState?.getStateEvents("m.room.pinned_events", "")?.getContent().pinned || [];
    setPinnedIds(pinnedList)
  }

  const onPinnedClick = async (id) => {
    if (pinnedIds && pinnedIds.length) {
      handleJump(id);
    }
  }

  const handleJump = async (eventId) => {
    const sdnEvent = timelineWindow.getEvents().find((event) => {
      return event.getId() === eventId
    });
    setFocusEventId(eventId);
    if (sdnEvent) {
      jumpLinkMsg(eventId);
    } else {
      await loadTimeline(eventId);
      setTimeout(() => {
        jumpLinkMsg(eventId);
      }, 300);
    }
  }

  const loadTimeline = async (eventId) => {
    const set = curRoom.getUnfilteredTimelineSet();
    const win = new TimelineWindow(api._client, set);
    setTimelineWindow(null);
    const res = await win.load(eventId, 20);
    setTimelineWindow(win);
    return res;
  }

  const keepFocus = () => {
    if (focusEventId) {
      jumpLinkMsg(focusEventId);
    }
  }

  const jumpLinkMsg = (id) => {
    api.eventEmitter && api.eventEmitter.emit && api.eventEmitter.emit('highlightRelateReply', 'message_item_' + id);
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

  const memberAvatarClick = (id) => { // click to show member profile view
    setMemberProfileId(id);
    // setShowType('memberProfile');
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

  // show forward view from blow two situations:
  // 1.selected msg more forward opetation
  // 2.mutiple selected msg more select operation then click forward btn
  const setShowForward = () => {
    setShowType('forward');
  }

  const closeMoreWrap = (evt) => {
    if (evt.target === showMoreThumbsUpEmojiPanelRef?.current) return
    // e.stopPropagation();
    setShowMoreMenu(false);
    setShowMoreThumbsUpEmojiPanel(false);
  }

  if (!curRoom) {
    return null
  }

  return (
    <Styled styles={styles}>
      <div ref={roomPageRef} className="roomPage widget_animate_invisible" onClick={() => { setCloseEmoji(new Date().getTime()) }}>
        {showType === 'profile' && <RoomProfile room={curRoom} isDMRoom={isDMRoom} backClick={handleProfileBack} memberClick={memberAvatarClick} onLeave={onBack} />}
        {showType === 'invite' && <InvitePage title="Invite User" roomId={curRoomId} onBack={() => setShowType('room')} />}
        {memberProfileId && <MemberProfile memberId={memberProfileId} roomId={curRoomId} onBack={() => {
          setMemberProfileId("");
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
                memberAvatarClick={memberAvatarClick}
                onPinnedClick={onPinnedClick}
              />
            )}
            <RoomView
              widgetWidth={widgetWidth}
              widgetHeight={widgetHeight}
              roomViewBgUrl={roomViewBgUrl}
              useRoomFuncs={useRoomFuncs}
              roomId={curRoomId}
              room={curRoom}
              timelineWindow={timelineWindow}
              loadTimeline={loadTimeline}
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
              handleJump={handleJump}
              keepFocus={keepFocus}
              focusEventId={focusEventId}
              setFocusEventId={setFocusEventId}
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
