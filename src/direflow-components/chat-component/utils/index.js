import { toastInfoIcon, toastErrorIcon, toastSuccessIcon } from "../imgs/index";
import { api } from "../api";
import EMOJIBASE from 'emojibase-data/en/compact.json';
import SHORTCODES from 'emojibase-data/en/shortcodes/iamcal.json';

class FilterWordsLibrary {
  constructor() {
      this.filterWordsArray = [];
  }

  init = (wordsStr) => {
    if (wordsStr && typeof wordsStr === 'string') {
      const wordsArr =  wordsStr.split(',') || []
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
    default: typeIcon = toastInfoIcon; break;
  }

  const wrap = document.createElement('div');
  wrap.style.width = '100%';
  wrap.style.height = '100%';
  wrap.style.position = 'absolute';
  wrap.style.top = 0;
  wrap.style.left = 0;
  wrap.style.right = 0;
  wrap.style.background = 'rgba(0, 0, 0, 0.4)';
  wrap.style.borderRadius = '20px';
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

  const contentLeft = document.createElement('img');
  contentLeft.src = typeIcon;
  contentLeft.style.height = '24px';

  const contentRight = document.createElement('div');
  contentRight.style.fontSize = '14px';
  contentRight.style.marginLeft = '10px';
  contentRight.style.color = '#CDCDCD';
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
  }
  return name;
};



/**
 * 
 * calculate the room name
 */
export const calculateRoomName = (room, isShowCount) => {
  const getInviteMembers = (allMembers, joinedMembers) => {
    const list = allMembers.filter(m => !joinedMembers.find(v => v?.userId === m?.userId))
    return list;
  }
  const getInviteRoomName = (inviteList) => {
    let name = "";
    if (inviteList.length <= 1) {
      name = formatTextLength(inviteList[0]?.name || inviteList[0]?.userId, 30, 12);
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
  let result = name;

  if (membersLen <= 1) {
    result = getInviteRoomName(inviteMembers) || name;
  } else if (membersLen === 2) {
    if (/^@sdn_/.test(name)) {
      const currentUserId = api.getUserId();
      const index = members.findIndex(v => v?.userId === currentUserId);
      members.splice(index, 1);
      const anotherUser = members[0];
      result = anotherUser?.name || anotherUser?.userId
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
export const getEventById = async (roomId, eventId, isTouristMode) => {
  const client = isTouristMode ? api.touristClient : api._client;
  try {
    const { ...res } = await client.fetchRoomEvent(roomId, eventId);
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
  const cont = userId.split(':')[1];
  return cont ? `0x${cont}` : userId;
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
 * get emoji collections
 */
export const getEmojis = () => {
  const emojis = EMOJIBASE.filter(emoji => emoji.group === 0);
  return emojis;
}