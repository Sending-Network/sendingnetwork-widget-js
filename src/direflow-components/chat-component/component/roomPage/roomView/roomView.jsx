import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Censor from "mini-censor";
import { Styled } from "direflow-component";
import styles from "./roomView.css";
import { api } from "../../../api";
import { filterLibrary, getEndOfDay, getDayStr, getGroupDateStr, formatTextLength, formatTextLastElide, calculateRoomName, renderTs, getAddressByUserId, getMemberName } from "../../../utils/index";
import { roomViewBg } from "../../../imgs/index";
import MessageItem from "../messageItem/messageItem";
import UrlPreviewComp from "../../UrlPreviewComp/UrlPreviewComp";
import { downIcon } from "../../../imgs/svgs";
// import { msgMoreOptIcon, moreThumbUpSwitchIcons, deletedMsgIcon } from "../../../imgs/index";
import { msgMoreOptIcon, deletedMsgIcon } from "../../../imgs/index";
import { getEmojis, getFrequentThumbUpEmojiList } from "../../../utils/index";
import { clone } from 'lodash'

const RoomView = ({
  widgetWidth,
  widgetHeight,
  roomViewBgUrl,
  useRoomFuncs,
  roomId,
  openUrlPreviewWidget,
  pinnedIds,
  setPinnedIds,
  pinEventSync,
  moreOperateMsg,
  setMoreOperateMsg,
  setShowReplyOrEditMsgDialog,
  inputFocus,
  setInputFocus,
  showMoreThumbsUpEmojiPanelRef,
  showMoreMenu,
  setShowMoreMenu,
  showMoreThumbsUpEmojiPanel,
  setShowMoreThumbsUpEmojiPanel,
  setShowMsgDeleteDialog,
  showMsgDeleteDialog,
  delStamp,
  memberAvatarClick,
  showCheckbox,
  onStartSelect,
  onCheckChanged,
  setShowForward
}) => {
  const frequentThumbUpEmojiList = getFrequentThumbUpEmojiList() // frequent thumbup emojis list
  const moreThumbsUpEmojiList = getEmojis(); // more thumbup emojis list
  const wrapperRef = useRef(null);
  const scrollRef = useRef(null);
  const moreMenuRef = useRef(null)
  const room = api._client.getRoom(roomId);
  const censor = new Censor(filterLibrary.get())
  const myName = api.userData.displayname;
  const atUserName = '@' + myName;

  const [fromToken, setFromToken] = useState("");
  const [messages, setMessages] = useState([]);
  const [currId, setCurrId] = useState(0);
  const [members, setMembers] = useState([]);
  const [previewImgUrl, setPreviewImgUrl] = useState("");
  const [isShowPreviewImg, setIsShowPreviewImg] = useState(false);
  const [fetchDataLoading, setFetchDataLoading] = useState(false);
  const [canStartFetchData, setCanStartFetchData] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [bottomDistance, setBottomDistance] = useState(0);
  const [firstPageGap, setFirstPageGap] = useState(0);
  const [isMounted, setIsMounted] = useState(true);
  const [showBottomBtn, setShowBottomBtn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastMsgTs, setLastMsgTs] = useState(0);
  // const [showMoreMenu, setShowMoreMenu] = useState(false); // whether display context menu when ringht click one msg
  // const [showMoreThumbsUpEmojiPanel, setShowMoreThumbsUpEmojiPanel] = useState(false); // whether display more thumbup emojis panel dialog
  const [showMoreThumbsUpEmojiPanelTop, setShowMoreThumbsUpEmojiPanelTop] = useState(0); // display more thumbup emojis panel dialog top position
  const [emotionSrc, setEmotionSrc] = useState('');
  const [curReactions, setCurReactions] = useState(null); // EventTile

  const getReactions = () => { // ReactionsPicker
    if (!curReactions) {
      return {};
    }
    const userId = api.getUserId();
    const myAnnotations = curReactions.getAnnotationsBySender()[userId] || [];
    return Object.fromEntries([...myAnnotations]
      .filter(event => !event.isRedacted())
      .map(event => [event.getRelation().key, event.getId()]));
  }

  useEffect(() => {
    roomViewStart();
    // api._client.on("Room.timeline", onTimeLine);
    return () => {
      setIsMounted(false)
      // api._client.removeListener("Room.timeline", onTimeLine);
      api.eventEmitter && api.eventEmitter.emit && api.eventEmitter.emit('unReadCount');
    };
  }, []);

  useLayoutEffect(() => {
    // handleScroll();
    if (wrapperRef?.current && messages?.length) {
      if (currId) {
        clearTimeout(currId);
      }
      const id = setTimeout(() => {
        applyMessages(messages);
      }, 10);
      setCurrId(id);
    }
  }, [wrapperRef?.current, messages?.length])

  useEffect(() => {
    roomViewStart();
  }, [delStamp])

  const applyMessages = (messages) => {
    console.log('applyMessages')
    const msg = messages[messages.length - 1];
    const ts = msg?.getTs();
    if (ts && ts != lastMsgTs) {
      if (msg.getType() === 'm.room.message') {
        scrollToBottom();
        setLastMsgTs(ts);
      }
    }
    backLoad(messages)
  }

  const backLoad = (messages) => {
    if (messages.length > 300) {
      return
    }
    if (Date.now() -  messages[messages.length - 1].getTs() > 7 * 86400000) {
      return
    }
    if (wrapperRef?.current && hasMore) {
      const { scrollTop, clientHeight, scrollHeight } = wrapperRef.current;
      queryMessage(clientHeight, 300);
    }
  }

  // fun
  const roomViewStart = () => {
    if (!messages || messages.length < 1) {
      initMembers();
      initMessage();
      setTimeout(scrollToBottom, 200);
    }
  };

  const initMessage = () => {
    const events = room.getLiveTimeline().getEvents();
    setMessages(events);
    setCanStartFetchData(true);
    setFetchDataLoading(false);
    if (events && events.length && events[0].getType() == 'm.room.create') {
      onAllLoaded();
    }
    // queryMessage();
  }

  const onAllLoaded = () => {
    setHasMore(false);
    console.log(scrollRef);
    if (scrollRef && scrollRef.current) {
      const total = scrollRef.current.clientHeight;
      console.log(total);
      setFirstPageGap(Math.max(0, total));
    }
  }

  const queryMessage = (d, len) => {
    setFetchDataLoading(true);
    const originToken = room.getLiveTimeline().getPaginationToken('b');
    // console.log('originToken', originToken);
    room.client.scrollback(room, len || 30).then(r => {
      setFetchDataLoading(false);
      const events = room.getLiveTimeline().getEvents();
      const newToken = room.getLiveTimeline().getPaginationToken('b');
      // console.log('new token', newToken);
      if (!newToken || newToken == originToken) {
        onAllLoaded();
      } else {
        if (events && events.length && events[0].getType() == 'm.room.create') {
          onAllLoaded();
        }
        setMessages(events);
      }
        setTimeout(() => {
          scrollToBottom(d);
        }, 200);
    }).catch(e => {
      console.log('queryMessage error', e);
      setFetchDataLoading(false);
    })
  };

  const initMembers = () => {
    const members = room.getJoinedMembers();
    // members.forEach((m) => {
    //   if (!m.user) {
    //     const user = api._client.getUser(m.userId);
    //     const [, address] = m.userId.split(":");
    //     user.setWalletAddress(`0x${address}`);
    //     m.user = user;
    //   }
    // });
    setMembers(members);
  };

  // const onTimeLine = async (event) => {
  //   if (event.getRoomId() !== roomId) return;
  //   if (event.getType() == "m.call.invite") {
  //     // call func
  //   } else {
  //     const eventArr = msgCensorFilter([event.event])
  //     handlePinEvent(eventArr);
  //     setMessages((messages) => {
  //       return [...messages, ...eventArr];
  //     });
  //   }
  // };

  const handlePinEvent = (events) => {
    for (let index in events) {
      if (events[index].type === "m.room.pinned_events") {
        pinEventSync(events[index]);
        break;
      }
    }
  }

  // const msgCensorFilter = (msgArr) => {
  //   const resultArr = msgArr || [];
  //   for (let i = 0; i < resultArr.length; i++) {
  //     const msg = resultArr[i];
  //     if (msg && msg.content && msg.content.msgtype === 'm.text') {
  //       const { text } = censor.filter(msg.content.body || '', { replace: true })
  //       resultArr[i]['content']['body'] = text
  //     }
  //   }
  //   return resultArr
  // }

  const formatSender = (sender) => {
    if (sender) {
      return formatTextLength(getMemberName(sender), 13, 5)
    }
    return "";
  };

  const httpString = (s) => {
    if (!s) return null;
    var reg = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    s = s.match(reg);
    return s;
  };

  const replaceUrl = (str) => {
    const re = /(f|ht){1}(tp|tps):\/\/([\w-]+\S)+[\w-]+([\w-?%#&=]*)?(\/[\w- ./?%#&=]*)?/g;
    str = str.replace(re, function (url) {
      return `<a class="url" href="${url}" target="_blank">${url}</a>`;
    });
    return str;
  }

  const replaceMention = (str) => {
    const re = /@\S*/g;
    str = str.replace(re, function (url) {
      const name = url.slice(1, url.length);
      const member = members.find(m => {
        return m.name === name || m.user?.displayName === name || m.userId === name
      });
      if (member) {
        return `<a class="mention" href="${url}">${url}</a>`;
      } else {
        return url
      }
    });
    return str;
  }

  const renderTime = (time) => {
    return renderTs(time);
  }

  const highlightAt = (bodyStr) => {
    let resultArr = [];
    if (bodyStr.indexOf(atUserName) !== -1) {
      const arr = bodyStr.split(atUserName);
      for (let i = 0; i < arr.length - 1; i++) {
        resultArr.push(arr[i]);
        resultArr.push(atUserName);
      }
      resultArr.push(arr[arr.length - 1]);
    }
    return resultArr
  }

  const formatTextMsg = (body) => {
    if (!body) {
      return <span></span>
    }
    const urls = httpString(body);
    let dangrous = false;
    if (urls && urls.length) {
      body = replaceUrl(body);
      dangrous = true;
    }
    if (body.indexOf('\n') > -1) {
      // const arr = body.split('\n');
      // const res = [];
      // for (let i = 0; i < arr.length; i++) {
      //   if (arr[i].indexOf(atUserName) > 0) {
      //     const atr = arr[i].split(atUserName);
      //     for (let j = 0; j < atr.length - 1; j++) {
      //       res.push(atr[i]);
      //       res.push(<span className="msgBox_at_highlight" key={res.length}>{atUserName}</span>)
      //     }
      //     res.push(atr[atr.length - 1]);
      //   } else {
      //     res.push(arr[i]);
      //   }
      //   res.push(<br key={res.length} />);
      // }
      // res.pop();
      body = body.replaceAll('\n', '<br/>');
      dangrous = true;
    }
    if (body.indexOf('@') > -1) {
      body = replaceMention(body);
      dangrous = true;
    }

    if (dangrous) {
      return <span dangerouslySetInnerHTML={{ __html: body }}></span>;
    } else {
      return <span>{body}</span>
    }
  }

  const jumpLinkMsg = (id) => {
    // e.stopPropagation()
    console.log('jumpLinkMsg', 'message_item_' + id)
    // const domWrapper = roomViewRef.current;
    // if (!domWrapper) return;
    // if (oh) {
    //   const h = roomViewRef.current.scrollHeight - oh;
    //   domWrapper.scrollTo(0, h);
    // } else {
    //   domWrapper.scrollTo(0, domWrapper.scrollHeight);
    // }
    api.eventEmitter && api.eventEmitter.emit && api.eventEmitter.emit('highlightRelateReply', 'message_item_' + id);
  }

  const getAliasMsg = (sdnEvent, user, value, msg, ts, isEdited) => {
    return <div className="alias_msg">
      {sdnEvent ? <div className="alias_target_msg" onClick={() => jumpLinkMsg(sdnEvent.event.event_id)}>
        <div className="alias_target_msg_user">{user}</div>
        <div className="alias_target_msg_value">{value}</div>
      </div> : null}
      <span className="alias_treply_msg">{msg}</span>
      <p className="msg_time">{`${isEdited ? '(edited) ' : ''}${renderTime(ts)}`}</p>
    </div>
  }

  const renderMsgContent = (room, sdnEvent, messages, globalPinned) => {
    const message = sdnEvent.event;
    const { sender, combine } = sdnEvent;
    const senderUserId = sender.userId;
    const senderName = formatSender(sender);
    const { content, type, origin_server_ts, unsigned } = message;
    let msgContent = null;
    if (type === 'm.room.pinned_events') {
      const { pinned = [] } = content;
      const userNick = formatSender(sender);
      if (pinned.length > globalPinned.value.length) {
        msgContent = `${userNick} pinned a message`;
      } else if (pinned.length < globalPinned.value.length) {
        msgContent = `${userNick} unpinned a message`;
      } else if (pinned.length > 0) {
        msgContent = `${userNick} changed the pinned message for the room`;
      }
      globalPinned.value = pinned;
    } else if (type === 'm.room.customized_events') {
      const { body, icon, link, link_text } = content;
      const userNick = formatSender(sender);
      msgContent = (
        <span className="red_envelope_event_item_cont">
          <img src={icon} />
          <a className="sender" onClick={() => memberAvatarClick(senderUserId)}>{userNick}</a>
          <span>{body.replace(link_text, '')}</span>
          <a className="link" onClick={() => openUrlPreviewWidget(link)}>{link_text}</a>
        </span>
      )
    } else if (type === 'm.room.create') {
      // console.log('alex061225: ', content, room)
      const roomName = room?.name ? calculateRoomName(room, true) : '';
      msgContent = <p>
        <span className="member_event_item_highlight" onClick={() => memberAvatarClick(senderUserId)}>{senderName}&nbsp;</span>
        created the group {formatTextLastElide(roomName, 24)}
      </p>;
    } else if (type === 'm.room.member') {
      // console.log('alex061225 m.room.member: ', content, sender, members)
      const { displayname, membership } = content;
      if (membership === 'invite') {
        const targetName = formatTextLength(displayname, 13, 5);
        msgContent = <p>
          <span className="member_event_item_highlight" onClick={() => memberAvatarClick(senderUserId)}>{senderName}&nbsp;</span>
          invited {targetName}
        </p>;
      } else if (membership === 'join' && (unsigned && (!unsigned.prev_content || unsigned.prev_content?.membership === 'invite'))) {
        const joinName = formatTextLength(displayname || senderName, 13, 5);
        msgContent = <p>
          <span className="member_event_item_highlight" onClick={() => memberAvatarClick(senderUserId)}>{joinName}&nbsp;</span>
          joined the room.
        </p>;
      }
    } else if (message.isDeleted && type !== 'm.reaction') { // 
      msgContent = <div className="deleted_msg">
        <img className="deleted_msg_icon" src={deletedMsgIcon} />
        <span className="deleted_msg_text">Message deleted</span>
      </div>

    } else if (type === 'm.room.message') {
      const { body, msgtype, ...other } = content;
      const formatedBody = formatTextMsg(body);
      switch (msgtype) {
        case "m.text":
          const urls = httpString(body);
          if (content['m.new_content']) { // edit msg -> only edited by myself -> sdm and sdn must edit msg in identical format
            const edited_event_user = members.find(m => m.userId === senderUserId);  // the user whose msg was edited
            msgContent = content['m.new_content'].body
          } else if (content['m.relates_to'] && content['m.relates_to']['m.in_reply_to']) { // reply msg
            const replied_event_Id = content['m.relates_to']['m.in_reply_to'].event_id; // replied msg‘s id
            const replied_event = room.findEventById(replied_event_Id) // replied msg(wrapped)
            const replied_event_sender = replied_event?.event?.sender; // replied msg’s sender
            const replied_event_content = replied_event?.event?.content; // replied msg's userid and content
            const replied_event_user = members.find(m => m.userId === replied_event_sender);  // replied msg's user
            let user = formatSender(replied_event_user);
            let value = '';
            let msg = '';
            let ts = renderTime(origin_server_ts);
            if (content.body.match(/<@sdn_.+>/)) { // msg replied by sdm
              var index = content.body.lastIndexOf(' ')
              const [x, y] = content.body.slice(index + 1).split('\n\n')
              if (replied_event_content && replied_event_content?.body && replied_event_content?.body.match(/<@sdn_.+>/)) { // once parse -> handle later
                var _index = replied_event_content.body.lastIndexOf(' ')
                const [_x, _y] = replied_event_content.body.slice(_index + 1).split('\n\n');
                value = _y;
                msg = y;
              } else {
                value = replied_event_content?.body;
                msg = y;
              }
            } else { // msg edited by sdn
              value = replied_event_content?.body;
              msg = content.body;
            }
            msgContent = getAliasMsg(replied_event, user, value, msg, origin_server_ts, message.isEdited);
          } else if (urls) { // msg contains link address
            const [urlBody] = urls;
            msgContent = (
              <UrlPreviewComp
                url={urlBody}
                message={formatedBody}
                ts={origin_server_ts}
                time={`${message.isEdited ? '(edited) ' : ''}${renderTime(origin_server_ts)}`}
                isRight={senderUserId === room.myUserId}
                openUrlPreviewWidget={openUrlPreviewWidget}
                onPreviewLoaded={onPreviewLoaded}
              />
            );
          } else if (content.format &&
            (content.format === 'org.sdn.custom.html' ||
              content.format === 'org.matrix.custom.html')) { // msg contains @somebody
            msgContent = formatedBody
          } else {
            msgContent = formatedBody;
          }
          break;
        case "m.image":
        case "m.gif":
          let url = other.url;
          if (/^mxc\:\/\/.+/.test(url)) {
            url = api._client.mxcUrlToHttp(url);
          }
          msgContent = (
            <img
              style={{ maxWidth: "100%", cursor: 'pointer', marginTop: '2px' }}
              src={`${url}`}
              onClick={() => showPreviewImg(url)}
            />
          );
          break;
        case "m.file":
          msgContent = "[File]";
          break;
        case "nic.custom.confetti":
          msgContent = (
            <span style={{ fontSize: '32px', lineHeight: '40px' }}>{body}</span>
          );
          break;
        default: break;
      }
    }
    return msgContent;
  };

  // dom
  const showPreviewImg = (url) => {
    setPreviewImgUrl(url);
    setIsShowPreviewImg(true);
  };

  const hidePreviewImg = (e) => {
    setPreviewImgUrl("");
    setIsShowPreviewImg(false);
    return false;
  };

  const scrollToBottom = (oh) => {
    const domWrapper = wrapperRef.current;
    if (!domWrapper) return;
    const h = domWrapper.scrollHeight - (oh || 0);
    // console.log('scrollToBottom', h, domWrapper.scrollHeight, oh);
    const { scrollTop, clientHeight, scrollHeight } = wrapperRef.current;
    // console.log('scrollTop', scrollTop);
    // console.log('clientHeight', clientHeight);
    // console.log('scrollHeight', scrollHeight);
    domWrapper.scrollTo({
      left: 0,
      top: h,
      // behavior: 'smooth'
    });
  };

  const handleScroll = (e) => {
    if (wrapperRef?.current) {
      const { scrollTop, clientHeight, scrollHeight } = wrapperRef.current;
      if (e) {
          setScrolled(true);
          setBottomDistance(scrollHeight - scrollTop);
      }
      // console.log([scrollTop, clientHeight, scrollHeight])
      if (scrollTop + clientHeight - scrollHeight > -1) {
        setShowBottomBtn(false);
      } else {
        setShowBottomBtn(true);
      }
      if (scrollTop < 1 && !fetchDataLoading && hasMore) {
        queryMessage(scrollHeight);
      } else if (scrollHeight <= clientHeight && hasMore) {
        queryMessage(clientHeight);
      }
    } else {
      showBottomBtn(false);
    }
  }

  const loadMore = async () => {
    // if (fetchDataLoading || !canStartFetchData) return;
    // console.log('load more')
    // queryMessage("start");
  };

  const onPreviewLoaded = () => {
    if (!scrolled) {
      scrollToBottom();
    } else {
      console.log(bottomDistance);
      scrollToBottom(bottomDistance);
      // keepDistance();
    }
  }

  const spawnMessageItems = (_messages) => {
    if (!_messages || !_messages.length) {
      return null
    }
    let lastSdnEvent;
    let sdnEvent;

    let messages = clone(_messages)
    let len = messages.length
    // for (let i = 0; i < len; i++) {
    //   let msg = messages[i].event
    //   if (msg && msg.type === 'm.reaction') { // msg thumbuped
    //     const { sender, content } = msg; // 
    //     // console.log('thumbup user：', msg)
    //     if (content['m.relates_to']) {
    //       const { event_id, key, rel_type } = content['m.relates_to'] // thumbuped msg
    //       let thumbupddMsg = messages.find(_msg => {
    //         return _msg && _msg.event.event_id === event_id
    //       });
    //       // console.log('---thumbupddMsg---', thumbupddMsg)
    //       if (thumbupddMsg) {
    //         thumbupddMsg.event.content.userThumbsUpEmojiList = []
    //       }
    //     }
    //   }
    // }
    let userThumbsUpEmoji = null
    for (let i = 0; i < len; i++) {
      let msg = messages[i].event
      if (msg && msg.content && msg.content['m.new_content']) { // edited msg
        let index = messages.findIndex(_msg => {
          return _msg && _msg.event.event_id === msg.content['m.relates_to'].event_id
        });
        if (index > -1) {
          // messages[index] = messages[i]
          messages[index].event.content.body = msg.content['m.new_content'].body
          messages[index].event.isEdited = true
        }
        // do not show this event
        messages[i] = null
      }
      if (msg && msg.type === 'm.room.redaction') { // msg after deleting one msg
        const { redacts } = msg; // deleted msg‘s evetn_id
        // console.error('deleted msg's evetn_id: ', msg, messages)
        let deletedMsg = messages.find(_msg => {
          return _msg && _msg.event.event_id === redacts
        });
        deletedMsg && (deletedMsg.event.isDeleted = true)
      }
      // if (msg && msg.type === 'm.reaction') { // msg after thumbuping
      //   const { sender, content } = msg; // user who has thumbuped
      //   // console.error('-----msg after thumbuping-----', msg)
      //   if (content['m.relates_to']) { // thumbup
      //     const { event_id, key, rel_type } = content['m.relates_to'] // thumbuped msg
      //     let thumbupddMsg = messages.find(_msg => { //thumbuped msg
      //       return _msg && _msg.event.event_id === event_id
      //     });
      //     // console.log('---thumbupddMsg---', thumbupddMsg)
      //     if (thumbupddMsg) {
      //       thumbupddMsg.event.content.userThumbsUpEmojiList = thumbupddMsg.event.content.userThumbsUpEmojiList || []
      //       userThumbsUpEmoji = thumbupddMsg.event.content.userThumbsUpEmojiList.find(item => (item.event_id === msg.event_id && item.key === key))
      //       if (!userThumbsUpEmoji) { // current msg has not yet thumbup current emoji
      //         thumbupddMsg.event.content.userThumbsUpEmojiList.push({
      //           event_id,
      //           key,
      //           rel_type,
      //           senderList: [sender]
      //         })
      //       } else { // current msg has thumbuped current emoji
      //         userThumbsUpEmoji.senderList.push(sender)
      //       }
      //     }
      //   } else { // cancle thumbuping
      //     if (userThumbsUpEmoji) {
      //       userThumbsUpEmoji.senderList = userThumbsUpEmoji.senderList.filter(item => item !== sender)
      //     }
      //   }
      // }
    }
    messages = messages.filter(msg => msg !== null)

    let currDelta = Number.MAX_SAFE_INTEGER;
    let arr = [];
    const todayTs = getEndOfDay(Date.now());
    const startOfDay = new Date(todayTs).setHours(0, 0, 0, 0);
    const startOfYesterday = startOfDay - 86400000;
    const startOfWeek = startOfDay - 86400000 * 6;
    const globalPinned = { value: [] };
    let str;
    let viewIndex = 0;
    for (let i = 0; i < messages.length; i++) {
      lastSdnEvent = i > 0 ? messages[i - 1] : null;
      sdnEvent = messages[i];
      const msgContentView = renderMsgContent(room, sdnEvent, messages, globalPinned);
      if (!msgContentView) {
        continue
      }
      sdnEvent.viewIndex = viewIndex;
      viewIndex++;
      const delta = Math.ceil((todayTs - sdnEvent.getTs()) / 86400000);
      let group = 'day';
      if (sdnEvent.getTs() < startOfWeek) {
        group = 'default';
      } else if (sdnEvent.getTs() < startOfYesterday) {
        group = 'week';
      } else if (sdnEvent.getTs() < startOfDay) {
        group = 'yesterday'
      }
      if (currDelta - delta >= 1) {
        currDelta = delta;
        str = 'Today';
        if (group === 'yesterday') {
          str = 'Yesterday'
        } else if (group === 'week') {
          str = getDayStr(new Date(sdnEvent.getTs()).getDay());
        } else if (group === 'default') {
          str = getGroupDateStr(sdnEvent.getTs());
        }
        arr.push(<div className="date-separator" key={sdnEvent.getTs()}>{str}</div>)
      }
      if (lastSdnEvent && lastSdnEvent.getType() === "m.room.message" && sdnEvent.getType() === 'm.room.message' && sdnEvent.getTs() - lastSdnEvent.getTs() < 120000 && sdnEvent.getSender() === lastSdnEvent.getSender()) {
        sdnEvent.combine = 3;
        if (lastSdnEvent.combine == 3) {
          lastSdnEvent.combine = 2;
        } else {
          lastSdnEvent.combine = 1;
        }
      }
      let needShowCheckbox = showCheckbox;
      if (sdnEvent.event?.isDeleted) {
        needShowCheckbox = false;
      }
      if (sdnEvent.event?.type !== 'm.room.message') {
        needShowCheckbox = false;
      }
      arr.push(<MessageItem
        roomId={roomId}
        key={sdnEvent.getId() || i}
        roomViewRef={wrapperRef}
        room={room}
        sdnEvent={sdnEvent}
        members={members}
        openUrlPreviewWidget={openUrlPreviewWidget}
        showPreviewImg={showPreviewImg}
        setShowMoreMenu={setShowMoreMenu}
        setMoreOperateMsg={setMoreOperateMsg}
        setShowMsgDeleteDialog={setShowMsgDeleteDialog}
        setCurReactions={setCurReactions}
        memberAvatarClick={memberAvatarClick}
        delta={delta}
        group={group}
        groupStr={str}
        msgContentView={msgContentView}
        showCheckbox={needShowCheckbox}
        onStartSelect={onStartSelect}
        onCheckChanged={onCheckChanged}
      />);
    }
    return arr
  }

  const closeMoreWrap = (e) => {
    // e.stopPropagation();
    // setShowMoreMenu(false);
    // setShowMoreThumbsUpEmojiPanel(false);
  }

  const handleEmotionClick = async (curEmoji) => { // click thumbup emoji -> ReactionPicker
    setShowMoreThumbsUpEmojiPanel(false);
    const myReactions = getReactions();
    if (myReactions.hasOwnProperty(curEmoji.unicode)) {
      api._client.redactEvent(
        roomId,
        myReactions[curEmoji.unicode],
      );
    } else {
      api._client.sendEvent(roomId, "m.reaction", {
        "m.relates_to": {
          "rel_type": "m.annotation",
          "event_id": moreOperateMsg.event.event_id,
          "key": curEmoji.unicode,
        },
      });
      // dis.dispatch({ action: "message_sent", type: 'to thumbup' });
    }
  }
  const handleMoreThumbUpSwtich = (e) => { // click more thumbup emojis dropdown button
    e.stopPropagation();
    if (!showMoreThumbsUpEmojiPanel) {
      const { y } = moreMenuRef?.current.getBoundingClientRect()
      const { y: _y } = wrapperRef?.current.getBoundingClientRect()
      console.log('--------------', showMoreThumbsUpEmojiPanel, y, _y)
      setShowMoreThumbsUpEmojiPanelTop(y - _y + 38)
    }
    setShowMoreThumbsUpEmojiPanel(!showMoreThumbsUpEmojiPanel);
  }

  const handleReplyClick = async (e) => {
    e.stopPropagation()
    setShowMoreMenu(false)
    setShowReplyOrEditMsgDialog('reply')
    setInputFocus(!inputFocus)
  }
  const handleForwardClick = async (e) => {
    console.log('start forward message')
    e.stopPropagation()
    setShowMoreMenu(false)
    setShowForward(true);
  }

  const handlePinClick = async (e) => {
    console.log('handlePinClick: ', moreOperateMsg)
    e.stopPropagation()
    api._client.setRoomAccountData(room.roomId, 'im.vector.room.read_pins', {
      event_ids: [
        ...(room.getAccountData('im.vector.room.read_pins')?.getContent()?.event_ids || []),
        moreOperateMsg?.event_id,
      ],
    });
    // const ids = [...pinnedIds, moreOperateMsg.getId()];
    const ids = [moreOperateMsg.getId()];
    await api._client.sendStateEvent(room.roomId, 'm.room.pinned_events', { pinned: ids }, "");
    setPinnedIds(ids);
    setShowMoreMenu(false)
  }

  const handleUnPinClick = async (e) => {
    console.log('handleUnPinClick: ', moreOperateMsg)
    e.stopPropagation();
    // const targetId = moreOperateMsg.getId();
    // const ids = pinnedIds.filter(value => value !== targetId);
    const ids = [];
    await api._client.sendStateEvent(room.roomId, 'm.room.pinned_events', { pinned: ids }, "");
    setPinnedIds(ids);
    setShowMoreMenu(false);
  }

  const handleSelectClick = async (e) => {
    console.log('start select message')
    e.stopPropagation();
    setShowMoreMenu(false);
    // setChecked(true);
    moreOperateMsg.checked = true;
    onStartSelect(moreOperateMsg);
  }
  const handleEditClick = async (e) => {
    console.log('start edit message')
    e.stopPropagation()
    setShowMoreMenu(false)
    setShowReplyOrEditMsgDialog('edit')
    setInputFocus(!inputFocus)
  }
  const handleDeleteClick = async (e) => {
    console.log('start delete message')
    e.stopPropagation()
    setShowMsgDeleteDialog(true)
    setShowMoreMenu(false)
  }

  const checkPinned = () => {
    if (pinnedIds && pinnedIds.length) {
      const targetId = moreOperateMsg.getId();
      if (pinnedIds.indexOf(targetId) > -1) {
        return true;
      }
    }
    return false;
  }

  return (
    <Styled styles={styles}>
      <div className={["roomView"].join(' ')}
        style={{
          backgroundImage: `url(${roomViewBgUrl || roomViewBg})`,
          backgroundRepeat: roomViewBgUrl ? 'no-repeat' : '',
          backgroundSize: roomViewBgUrl ? 'auto 100%' : '100% auto'
        }}>
        <div className="msgBox_more_menu_wrap" onClick={closeMoreWrap}>
          <div
            className="scroll-wrapper"
            ref={wrapperRef}
            onScroll={handleScroll}
          >
            <div
              className="room-scroll"
              ref={scrollRef}
            >
              <div className="msg-first-page"></div>
              {hasMore ? <div className="roomView_scroll_loader" key={'loader'}>Loading ...</div>
                : <div className="roomView_scroll_noMore">-- This is the beginning of the conversation --</div>}
              <div className="msg-top-station"></div>
              {spawnMessageItems(messages)}
              <div className="msg-bottom-station"></div>
            </div>

            {showBottomBtn ? <div className="bottom-btn" onClick={() => { scrollToBottom() }}>
              {downIcon}
            </div> : null}

            {/* img preview */}
            {isShowPreviewImg && (
              <div className="previewImg" onClick={hidePreviewImg}>
                <img src={previewImgUrl} onClick={(e) => e.stopPropagation()} />
              </div>
            )}

            {(showMoreMenu) && (
              // <div className="msgBox_more_menu_wrap" onClick={closeMoreWrap}>
              <div ref={moreMenuRef}
                className="msgBox_more msgBox_more_right"
                style={{
                  // left: Math.min(showMoreMenu.left, parseFloat(widgetWidth) - 156 - 16),
                  left: `min(${showMoreMenu.left}px, calc(${widgetWidth} - 172px))`,
                  // top: Math.min(showMoreMenu.top, parseFloat(widgetHeight) - 266 - 60)
                  top: `min(${showMoreMenu.top}px, calc(${widgetHeight} - 326px))`
                  }}>
                {/* <div className="msgBox_more msgBox_more_right"> */}
                <span className="msgBox_more_frequent_thumbsUp_emojs_item" onClick={() => handleEmotionClick(frequentThumbUpEmojiList[0])}>{frequentThumbUpEmojiList[0].unicode}</span>
                <span className="msgBox_more_frequent_thumbsUp_emojs_item" onClick={() => handleEmotionClick(frequentThumbUpEmojiList[1])}>{frequentThumbUpEmojiList[1].unicode}</span>
                <span className="msgBox_more_frequent_thumbsUp_emojs_item" onClick={() => handleEmotionClick(frequentThumbUpEmojiList[2])}>{frequentThumbUpEmojiList[2].unicode}</span>
                <span className="msgBox_more_frequent_thumbsUp_emojs_item" onClick={() => handleEmotionClick(frequentThumbUpEmojiList[3])}>{frequentThumbUpEmojiList[3].unicode}</span>
                <span className="msgBox_more_frequent_thumbsUp_emojs_item" onClick={() => handleEmotionClick(frequentThumbUpEmojiList[4])}>{frequentThumbUpEmojiList[4].unicode}</span>
                {/* <span className="msgBox_more_frequent_thumbsUp_emojs_item" onClick={() => handleEmotionClick(frequentThumbUpEmojiList[5])}>{frequentThumbUpEmojiList[5].unicode}</span> */}
                {/* <img className={['msgBox_more_img', 'thumb_up_switch', showMoreThumbsUpEmojiPanel && 'active'].join(' ')} src={showMoreThumbsUpEmojiPanel ? moreThumbUpSwitchIcons[1] : moreThumbUpSwitchIcons[0]} onClick={handleMoreThumbUpSwtich} /> */}
                <span className={['msgBox_more_img', 'thumb_up_switch', showMoreThumbsUpEmojiPanel && 'active'].join(' ')} ref={showMoreThumbsUpEmojiPanelRef} onClick={handleMoreThumbUpSwtich}></span>
                {!showMoreThumbsUpEmojiPanel && <div className="msgBox_more_menu msgBox_more_menu_right">
                  <div className="msgBox_more_menu_item reply" onClick={handleReplyClick}>
                    <img className="msgBox_more_opt_item_icon" src={msgMoreOptIcon[0]} />
                    <div className="msgBox_more_opt_item_text">Reply</div>
                  </div>
                  <div className="msgBox_more_menu_item forward" onClick={handleForwardClick}>
                    <img className="msgBox_more_opt_item_icon" src={msgMoreOptIcon[1]} />
                    <div className="msgBox_more_opt_item_text">Forward</div>
                  </div>
                  <div className="msgBox_more_menu_item pin" onClick={checkPinned() ? handleUnPinClick : handlePinClick}>
                    <img className="msgBox_more_opt_item_icon" src={msgMoreOptIcon[2]} />
                    <div className="msgBox_more_opt_item_text">{checkPinned() ? 'UnPin' : 'Pin'}</div>
                  </div>
                  <div className="msgBox_more_menu_item select" onClick={handleSelectClick}>
                    <img className="msgBox_more_opt_item_icon" src={msgMoreOptIcon[3]} />
                    <div className="msgBox_more_opt_item_text">Select</div>
                  </div>
                  {moreOperateMsg.event.sender === room.myUserId && <div className="msgBox_more_menu_item edit" onClick={handleEditClick}>
                    <img className="msgBox_more_opt_item_icon" src={msgMoreOptIcon[4]} />
                    <div className="msgBox_more_opt_item_text">Edit</div>
                  </div>}
                  {moreOperateMsg.event.sender === room.myUserId && <div className="msgBox_more_menu_item delete" onClick={handleDeleteClick}>
                    <img className="msgBox_more_opt_item_icon" src={msgMoreOptIcon[5]} />
                    <div className="msgBox_more_opt_item_text">Delete</div>
                  </div>}
                </div>}
              </div>
              // </div>
            )}

            {showMoreThumbsUpEmojiPanel && <div className="msgBox_more_emojs_panel" style={{ top: showMoreThumbsUpEmojiPanelTop }}>
              {moreThumbsUpEmojiList.map((emoji, emojiIndex) => {
                return (
                  <div
                    className="msgBox_more_thumbsUp_emojs_item"
                    key={emojiIndex}
                    onClick={() => handleEmotionClick(emoji)}
                  >
                    <span>{emoji.unicode}</span>
                  </div>
                )
              })
              }
            </div>}

            {emotionSrc && (<div className="msgBox_emotion_wrap" onClick={closeMoreWrap}>
              <img className="msgBox_more_img_active" src={emotionSrc} />
            </div>)}
          </div>
        </div>
      </div>
    </Styled>
  );
};

export default RoomView;
