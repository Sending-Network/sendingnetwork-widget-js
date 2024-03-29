import dayjs from 'dayjs';
import EMOJIBASE from 'emojibase-data/en/compact.json';
import FREQUENTEMOJIOBASE from './frequent-emojibase.json';
import { api } from "../api";
import { toastInfoIcon, toastErrorIcon, toastSuccessIcon, copySuccessIcon } from "../imgs/index";

const EventType = {
  RemarkedRoomList: "m.remarked_room_list"
}
class FilterWordsLibrary {
  constructor() {
    this.filterWordsArray = [];
  }

  init = (wordsStr) => {
    if (wordsStr && typeof wordsStr === 'string') {
      const wordsArr = wordsStr.split(',') || []
      if (wordsArr && Array.isArray(wordsArr)) {
        this.filterWordsArray = wordsArr;
      }
    }
  }

  get = () => {
    return this.filterWordsArray
  }
}

export const filterLibrary = new FilterWordsLibrary();


/**
 * 
 * show toast
 */
export const showToast = ({ type, msg, duration = 1250, callback }) => {
  let typeIcon = "";
  switch (type) {
    case 'success': typeIcon = toastSuccessIcon; break;
    case 'error': typeIcon = toastErrorIcon; break;
    case 'info': typeIcon = toastInfoIcon; break;
    case 'none': typeIcon = ''; break;
    default: typeIcon = toastInfoIcon; break;
  }

  const wrap = document.createElement('div');
  wrap.style.width = '100%';
  wrap.style.height = '100%';
  wrap.style.position = 'absolute';
  wrap.style.top = 0;
  wrap.style.left = 0;
  wrap.style.right = 0;
  wrap.style.zIndex = 1000;
  wrap.style.background = 'rgba(0, 0, 0, 0.4)';
  // wrap.style.borderRadius = '20px';
  wrap.style.display = 'flex';
  wrap.style.alignItems = 'center';
  wrap.style.justifyContent = 'center';

  const content = document.createElement('div');
  content.style.maxWidth = '60%';
  content.style.padding = '12px';
  content.style.background = '#2D3137';
  content.style.borderRadius = '12px';
  content.style.display = 'flex';
  content.style.alignItems = 'center';

  if (type !== 'none') {
    const contentLeft = document.createElement('img');
    contentLeft.src = typeIcon;
    contentLeft.style.height = '24px';
    contentLeft.style.marginRight = '10px';
    content.appendChild(contentLeft);
  }

  const contentRight = document.createElement('div');
  contentRight.style.fontSize = '14px';
  contentRight.style.color = '#CDCDCD';
  contentRight.innerText = msg;
  content.appendChild(contentRight);
  wrap.appendChild(content);
  const rootDom = window.widgetChatDom;
  rootDom.appendChild(wrap);

  setTimeout(() => {
    rootDom.removeChild(wrap);
    if (callback) callback();
  }, duration)
}

export const showMessage = ({ msg, duration = 3000, callback }) => {

  const wrap = document.createElement('div');
  wrap.style.width = '100%';
  // wrap.style.height = '100%';
  wrap.style.position = 'absolute';
  wrap.style.top = '60px';
  wrap.style.left = 0;
  wrap.style.right = 0;
  wrap.style.zIndex = 1000;
  wrap.style.display = 'flex';
  wrap.style.alignItems = 'flex-start';
  wrap.style.justifyContent = 'center';

  const content = document.createElement('div');
  content.style.maxWidth = '60%';
  content.style.padding = '12px';
  content.style.background = '#fff';
  content.style.borderRadius = '9px';
  content.style.boxShadow = '0px 6px 10px 0px rgba(0, 0, 0, 0.25)';
  content.style.display = 'flex';
  content.style.alignItems = 'center';

  const contentLeft = document.createElement('img');
  contentLeft.src = copySuccessIcon;
  contentLeft.style.height = '24px';

  const contentRight = document.createElement('div');
  contentRight.style.fontSize = '14px';
  contentRight.style.marginLeft = '10px';
  contentRight.style.color = '#333';
  contentRight.innerText = msg;

  content.appendChild(contentLeft);
  content.appendChild(contentRight);
  wrap.appendChild(content);
  const rootDom = window.widgetChatDom;
  rootDom.appendChild(wrap);

  setTimeout(() => {
    rootDom.removeChild(wrap);
    if (callback) callback();
  }, duration)
}

/**
 * 
 * show text eg: xdss...xcs
 */
export const formatTextLength = (name, limit, len) => {
  if (name && name.length && name.length > limit) {
    return `${name.slice(0, len)}...${name.slice(name.length - len)}`;
    // return `${name.slice(0, len)}...`;
  }
  return name;
};
export const formatTextLastElide = (name, limit) => {
  if (name && name.length && name.length > limit) {
    return `${name.slice(0, limit)}...`;
  }
  return name;
};



/**
 * 
 * calculate the room name
 */
export const calculateRoomName = (room, isShowCount) => {
  const handleNameUserId = (nameStr) => {
    if (!nameStr) return '';
    nameStr = nameStr.trim();
    const lowerCaseStr = nameStr.toLowerCase();
    if (/^@sdn_/.test(lowerCaseStr)) {
      return getAddressByUserId(lowerCaseStr) || '';
    } else {
      return nameStr;
    }
  }
  const getInviteMembers = (allMembers, joinedMembers) => {
    const list = allMembers.filter(m => !joinedMembers.find(v => v?.userId === m?.userId))
    return list;
  }
  const getInviteRoomName = (inviteList) => {
    let name = "";
    if (inviteList.length <= 1) {
      const addr = getAddressByUserId(inviteList[0]?.userId);
      const nameStr = handleNameUserId(inviteList[0]?.name);
      name = nameStr || addr;
    } else {
      name = `You and ${inviteList.length} others`
    }
    return name;
  }

  const { name, roomId } = room;
  const allMembers = room.getMembers();
  const members = room.getJoinedMembers();
  const inviteMembers = getInviteMembers(allMembers, members);
  let membersLen = members.length;
  let result = handleNameUserId(name);

  if (membersLen <= 1) {
    result = getInviteRoomName(inviteMembers) || handleNameUserId(name);
  } else if (membersLen === 2) {
    if (/^@sdn_/.test(name)) {
      const currentUserId = api.getUserId();
      const index = members.findIndex(v => v?.userId === currentUserId);
      members.splice(index, 1);
      const anotherUser = members[0];
      result = anotherUser?.name || getAddressByUserId(anotherUser?.userId)
    }
  }
  // show member count
  if (isShowCount) {
    if (membersLen > 2) {
      result = `${result} (${membersLen})`
    }
  }
  return result
};

export const calculateRoomTopic = (room) => {
  const topicEvent = room.currentState.getStateEvents("m.room.topic", "");
  const topic = topicEvent && topicEvent.getContent()
    ? topicEvent.getContent()["topic"] || ""
    : "";
  return topic;
}

export const calculateRemark = (room) => {
  const remarkEvent = api._client.getAccountData(EventType.RemarkedRoomList);
  const remark = remarkEvent && remarkEvent.getContent()
    ? remarkEvent.getContent()?.remarked_room[room.roomId]?.remark || ""
    : "";
  return remark;
}

export const calculateNickName = (room) => {
  const spaceRoom = room.getParentRoom();

  if (spaceRoom) {
    room = spaceRoom;
  }
  return room.getNickName();
}

/**
 * 
 * web3 Contract
 */
export const web3ContractConstant = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
]


/**
 * 
 * token list for tokenSwap
 */
export const tokenList = [["SHIB", "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce"],
["WETH", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"],
["DAI", "0x6b175474e89094c44da98b954eedeac495271d0f"],
["USDC", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"],
["USDT", "0xdac17f958d2ee523a2206206994597c13d831ec7"]];



/**
 * 
 * get event by room & eventId
 */
export const getEventById = async (roomId, eventId, isTouristMode, updateContent=false) => {
  const client = isTouristMode ? api.touristClient : api._client;
  try {
    const { ...res } = await client.fetchRoomEvent(roomId, eventId);
    if(updateContent) {
      const replaceEvents = await client.fetchRelations(roomId, eventId, "m.replace", "m.room.message", {});
      if(replaceEvents['chunk']) {
        const repEvent = replaceEvents['chunk'][0]
        if(repEvent) {
          res['content'] = repEvent['content']['m.new_content']
        }
      }
    }
    return res;
  } catch (err) {
    console.error("Error getEventById" + eventId + " in room " + roomId);
    console.error(err);
    showToast({
      type: 'success',
      msg: 'Operation failed',
    })
  }
  return {};
}


/**
 * getAddressByUserId
 */
export const getAddressByUserId = (userId) => {
  if (!userId || typeof userId !== 'string') return '';
  const cont = userId.split(':')[1];
  return cont ? `0x${cont}` : userId;
}


/**
 * getAddressByUserId
 */
export const getDidByUserId = (userId) => {
  const cont = userId.split(':')[1];
  return `did:sdn:${cont}`;
}

/**
 * throttled: first execution after delay milliseconds
 */
export const throttled = (fn, delay = 500) => {
  let timer = null
  return function (...args) {
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(this, args)
        timer = null
      }, delay);
    }
  }
}


/**
 * Drag and drop an element to move freely
 */
export const dragging = (rootDom) => {
  var draggingObj = null;
  var diffX = 0;
  var diffY = 0;

  const mouseDown = (e) => {
    draggingObj = rootDom;
    diffX = e.clientX - draggingObj.offsetLeft;
    diffY = e.clientY - draggingObj.offsetTop;
  }
  const mouseHandler = (e) => {
    switch (e.type) {
      case "mousemove":
        if (draggingObj) {
          draggingObj.style.left = e.clientX - diffX + 'px';
          draggingObj.style.top = e.clientY - diffY + 'px';
        }
        break;
      case "mouseup":
        draggingObj = null;
        diffX = 0;
        diffY = 0;
        break;
    }
  }
  return {
    enable: function () {
      rootDom.addEventListener("mousedown", mouseDown);
      document.addEventListener("mousemove", mouseHandler);
      document.addEventListener("mouseup", mouseHandler);
    },
    disable: function () {
      rootDom.removeEventListener("mousedown", mouseDown);
      document.removeEventListener("mousemove", mouseHandler);
      document.removeEventListener("mouseup", mouseHandler);
    },
  };
};


/**
 * Parsing and transmitting parameters with useWidgetBtn
 */
export const parseUseWidgetBtn = (str, width, height) => {
  let styleObj = {};
  const posMap = {
    'leftTop': { left: '70px', top: '70px' },
    'rightTop': { left: `-${width}`, top: '70px' },
    'leftBottom': { left: '70px', top: `-${height}` },
    'rightBottom': { left: `-${width}`, top: `-${height}` },
  }
  const propertyArr = str.split(";");
  propertyArr.map(item => {
    const keyValArr = item.split(':');
    if (keyValArr.length === 2) {
      styleObj[keyValArr[0]] = keyValArr[1]
    }
  })
  styleObj.widgetPos = posMap[styleObj['pos']];
  styleObj.btnPos = {
    left: styleObj.left,
    top: styleObj.top
  }
  return styleObj;
}

/**
 * get icon collections
 */
export const getFrequentThumbUpEmojiList = () => {
  // const allEmojis = getEmojis()
  // return allEmojis.slice(0, 6)
  const emojis = FREQUENTEMOJIOBASE.filter(emoji => (emoji.group === 0 || emoji.group === 1));
  return emojis;
}

/**
 * get emoji collections
 */
export const getEmojis = () => {
  const emojis = EMOJIBASE.filter(emoji => emoji.group === 0);
  return emojis;
}

/**
 * format msg time show
 */
export const renderTs = (ts) => {
  const date = new Date(ts);
  const h = date.getHours();
  let m = date.getMinutes();
  if (m <= 9) {
    m = '0' + m;
  }
  return `${h}:${m}`;
}

export const getEndOfDay = (ts) => {
  return new Date(ts).setHours(23, 59, 59, 999)
}

export const getDayStr = (day) => {
  // return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
  if (day >= 0 && day < 7) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thurday', 'Friday', 'Saturday'][day];
  }
  return day
}

export const getGroupDateStr = (ts) => {
  const d = new Date(ts);
  const month = ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()];
  return `${month} ${d.getDate()} ${d.getFullYear()}`
}

export const formatUserName = (name) => {
  return formatTextLength(name || '', 24, 5);
}

export const getMemberName = (member) => {
  return member?.name || member?.user?.displayName || member?.userId;
}

export const getDefaultAvatar = (userId) => {
  return `https://static.sending.me/beam/70/${userId}?colors=FC774B,FFB197,B27AFF,DAC2FB,F0E7FD&square=true`;
}

export const getMsgStr = (event, isDmRoom, userId) => {
  const content = event.getContent();
  const newContent = event.event['m.new_content'];
  const eventType = event.getType();
  const senderName = formatUserName(getMemberName(event.sender));
  const senderUid = event.sender?.userId || '';

  if (eventType === 'm.room.message' && content) {
    let contentStr;
    const body = newContent?.body || content.body;
    switch (content.msgtype) {
      case 'm.text':
        contentStr = body;
        break;
      case 'm.image':
        contentStr = '[Image]';
        break;
      case 'm.gif':
        contentStr = body;//'[Gif]';
        break;
      case 'm.file':
        contentStr = '[File]';
        break;
        default:
          break;
    }
    if (contentStr) {
      if (isDmRoom) {
        return contentStr;
      } else if (senderUid === userId) {
        return contentStr;
      } else {
        return `${senderName}: ${contentStr}`;
      }
    }
  } else if (eventType === 'm.room.create') {
    if (senderUid === userId) {
      return 'You created this room';
    } else {
      return `${senderName} created this room`;
    }
  // } else if (eventType === 'm.room.member') {
  //   const prevContent = event.getPrevContent();
  //   const displayname = formatUserName(prevContent?.displayname || content.displayname || senderName);
  //   const prevState = prevContent?.membership;
  //   const stateChanged = prevState !== content.membership;
  //   if (stateChanged) {
  //     switch (content.membership) {
  //       case 'join':
  //         return `${displayname} joined the room`;
  //       case 'invite':
  //         return `${senderName} invited ${displayname}`;
  //     }
  //   }
  // } else if (eventType === 'm.room.pinned_events') {
  //   const curr = content.pinned;
  //   const prevContent = event.getPrevContent();
  //   if (prevContent) {
  //     const prev = prevContent.pinned;
  //     if ((prev?.length || 0) > (curr?.length || 0)) {
  //       return `${senderName} unpinned a message`
  //     }
  //   }
  //   return `${senderName} pinned a message`
  // } else if (eventType === 'm.room.redaction') {
  //   return `${senderName} deleted a message`
  }
  return null
}

/**
 * isMobile judge
 */
export const isMobile = () => {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  return isIos || isAndroid;
}


/**
 * format time to show
 */
export const timeFormat = (timeStr) => {
  if (!timeStr) return '';
  const time = dayjs(timeStr);
  const today = dayjs().startOf('day');
  const week = dayjs().subtract(6, 'day');
  if (time.isAfter(today)) {
    return time.format('HH:mm');
  } else if (time.isAfter(week)) {
    return time.format('ddd');
  } else {
    return time.format('MMM') + ' ' + time.format('DD');
  }
}

/* 
 * render Animation
 */
export const renderAnimation = (animateDom, animateName, animateStartCb, animateEndCb) => {
  animateDom.classList.add('animate__animated', animateName)
  animateDom.classList.remove('widget_animate_invisible')
  animateDom.addEventListener('animationstart', (evt) => {
    console.log('animationstart', evt)
    animateStartCb && animateStartCb()
  })
  animateDom.addEventListener('animationend', (evt) => {
    console.log('animationend', evt)
    animateDom.classList.remove('animate__animated', animateName)
    animateEndCb && animateEndCb()
  })
}

/* 
 * get invite SendingNetworkEvent
 */
export const getInviteSendEvent = (room) => {
  const userId = api.getUserId()
  return room.currentState?.members[userId]?.events?.member
}
