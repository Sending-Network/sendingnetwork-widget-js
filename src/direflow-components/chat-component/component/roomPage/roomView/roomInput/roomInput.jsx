import React, { useEffect, useState, useRef } from "react";
import { Styled } from "direflow-component";
import styles from "./roomInput.css";
import Web3 from "web3";
import { MaxUint256 } from "@ethersproject/constants";
import { api } from "../../../../api";
import {
  roomInputMoreMoney,
  roomInputMorePic,
  roomInputMorePeerSwap,
} from "../../../../imgs/index";
import {
  emojiIcon, plusIcon, sendIcon
} from "../../../../imgs/svgs"
import { web3ContractConstant, tokenList, showToast, getEmojis } from "../../../../utils/index";
import { checkChain } from "../../../../utils/gasFee";
import { AvatarComp } from "../../../avatarComp/avatarComp";
import RoomAvatar from "../../../roomAvatar/roomAvatar";
import { addTimestamp } from "../../../webViewComp/webViewComp";
import InputArea from "./inputArea";
import { msgReplyIcon, msgEditIcon, cancelReplyOrEditIcon } from "../../../../imgs/index";
import UserAvatar from "../../../userAvatar/userAvatar";
import MentionList from "./mentionList";

const RoomInput = ({
  room,
  useRoomFuncs,
  openUrlPreviewWidget,
  closeEmoji,
  showReplyOrEditMsgDialog,
  setShowReplyOrEditMsgDialog,
  inputFocus,
  moreOperateMsg,
  showCheckbox,
  uploadFile
}) => {
  const [web3, setWeb3] = useState();
  const uploadRef = useRef(null);
  const emojis = getEmojis();
  const [sendValue, setSendValue] = useState(""); // text content which is going to be sent in input box
  const [transferCount, setTransferCount] = useState(0);
  const [showTransferTip, setShowTransferTip] = useState(false);
  const [tokenSwapCount, setTokenSwapCount] = useState(0);
  const [showTokenSwapTip, setShowTokenSwapTip] = useState(false);
  const [showInputMaxPrompt, setShowInputMaxPrompt] = useState(false); // whether display tips dialog when text content letters exceed max limit
  const [showMemberList, setShowMemberList] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectionIndex, setSelectionIndex] = useState(-1);
  const [atIndex, setAtIndex] = useState(0);
  const [memberFilter, setMemberFilter] = useState('')
  const [memberList, setMemberList] = useState([]);
  const [memberListFocus, setMemberListFocus] = useState(0);
  const [showMoreBox, setShowMoreBox] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [isDmRoom, setIsDmRoom] = useState(true);
  const [sendTimestamp, setSendTimestamp] = useState(0);
  const [replyingToUser, setReplyingToUser] = useState(null);
  const [localInputFocus, setLocalInputFocus] = useState(0);

  useEffect(() => {
    setWeb3(new Web3(window.ethereum));
    initMembers();
    if (room && room.sendValue) {
      setSendValue(room.sendValue);
    }
    document.addEventListener('click', handleClickInput);
    return () => {
      document.addEventListener('click', handleClickInput);
    }
  }, []);

  useEffect(() => {
    setShowMoreBox(false);
    setShowEmojiPanel(false);
    setShowMemberList(false);
  }, [closeEmoji]);

  // useEffect(() => {
  //   handleTransferTip()
  //   handleTokenSwapTip()
  // }, [sendValue]);

  useEffect(() => {
    if (moreOperateMsg) {
      const { sender } = moreOperateMsg;
      setReplyingToUser(sender);
    }
  }, [moreOperateMsg])

  useEffect(() => {
    if (moreOperateMsg) {
      if (showReplyOrEditMsgDialog === 'edit') {
        (setSendValue(moreOperateMsg.getContent().body))
        setSendTimestamp(Date.now());
      } else if (showReplyOrEditMsgDialog === 'reply') {
        (setSendValue(''))
      }
    }
    setLocalInputFocus(inputFocus);
  }, [inputFocus])

  useEffect(() => {
    if (room) {
      room.sendValue = sendValue;
    }
  }, [sendValue])

  const handleClickInput = () => {
    setShowMoreBox(false);
  }

  const handleTransferTip = () => {
    const isTransfer = sendValue.indexOf("$Transfer") !== -1;
    const count = sendValue.split("<").length;
    setTransferCount(count);
    setShowTransferTip(isTransfer);
  }

  const handleTokenSwapTip = () => {
    const isTokenSwap = sendValue.indexOf("$TokenSwap") !== -1;
    const count = sendValue.split("<").length;
    setTokenSwapCount(count);
    setShowTokenSwapTip(isTokenSwap);
  }

  const renderTransferTip = () => {
    return showTransferTip ? (
      <div className="tip">
        <span className={[transferCount >= 1 ? "active" : ""]}>$Transfer</span>
        <span
          className={[transferCount >= 2 ? "active" : ""]}
        >{`<to_address>`}</span>
        <span
          className={[transferCount >= 3 ? "active" : ""]}
        >{`<crypto>`}</span>
        <span className={[transferCount >= 4 ? "active" : ""]}>
          {`<amount>`}
        </span>
      </div>
    ) : null
  }

  const onSelectionChanged = (start, end) => {
    if (isDmRoom) return
    let shouldShowMentionList = false;
    if (start === end) {
      const lastIndex = sendValue.lastIndexOf('@');
      if (lastIndex >= 0 && lastIndex < start) {
        const editValue = (sendValue.slice(lastIndex + 1, start) || '').toLowerCase();
        setAtIndex(lastIndex);
        setMemberFilter(editValue);
        const list = memberList?.filter(value =>
          value.name && value.name.toLowerCase().includes(editValue)
        )
        setFilteredMembers(list);
        if (list && list.length) {
          shouldShowMentionList = true;
        }
      }
    }
    setShowMemberList(shouldShowMentionList);
  }

  const renderTokenSwapTip = () => {
    return showTokenSwapTip ? (
      <div className="tip">
        <span className={[tokenSwapCount >= 1 ? "active" : ""]}>$TokenSwap</span>
        <span
          className={[tokenSwapCount >= 2 ? "active" : ""]}
        >{`<SellToken>`}</span>
        <span
          className={[tokenSwapCount >= 3 ? "active" : ""]}
        >{`<SellAmount>`}</span>
        <span className={[tokenSwapCount >= 4 ? "active" : ""]}>
          {`<BuyToken>`}
        </span>
      </div>
    ) : null
  }

  const transfer = async (text) => {
    const isTransfer = text.indexOf("$Transfer") !== -1;
    if (isTransfer) {
      let [from] = await web3.eth.getAccounts();
      try {
        const {
          chain_id,
          gas,
          nonce,
          trading_amount,
          to_address,
          wealth_type,
          ex_field,
        } = await api.smartTradingTextParse(text, from);

        checkChain(chain_id, () => {
          switch (wealth_type) {
            case "ETH":
              web3.eth.sendTransaction(
                {
                  from,
                  to: to_address,
                  value: web3.utils.toWei(trading_amount, "ether"),
                  gas,
                  nonce,
                },
                (err, address) => {
                  if (err) {
                  } else {
                    api._client.sendMessage(
                      room.roomId,
                      {
                        body: `The transaction has been submitted, please refer to the transaction ID for details: '${address}'.`,
                        msgtype: "m.text",
                      },
                      ""
                    );
                  }
                }
              );
              break;
            case "UNI":
              const transactionParameters = JSON.parse(ex_field);
              const { to } = transactionParameters;
              let MyContract = new web3.eth.Contract(
                web3ContractConstant,
                to
              );
              let data = MyContract.methods
                .transfer(to_address, web3.utils.toWei(trading_amount, "ether"))
                .encodeABI();

              window.ethereum
                .request({
                  method: "eth_sendTransaction",
                  params: [
                    {
                      ...transactionParameters,
                      data,
                      gas: "21000",
                      gasPrice: "21000",
                    },
                  ],
                })
                .then((res) => {
                  api._client.sendMessage(
                    room.roomId,
                    {
                      body: `The transaction has been submitted, please refer to the transaction ID for details: '${res}'.`,
                      msgtype: "m.text",
                    },
                    ""
                  );
                });
              break;

            default:
              break;
          }
        });
      } catch (error) { }
    }
  };

  const tokenMap = new Map(tokenList);

  const tokenSwap = async (text) => {
    if (text.indexOf("$TokenSwap") === -1) return;
    const erc20abi = [{ "inputs": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "symbol", "type": "string" }, { "internalType": "uint256", "name": "max_supply", "type": "uint256" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "burnFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" }], "name": "decreaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" }], "name": "increaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }]
    const [from] = await web3.eth.getAccounts();
    try {
      const fromToken = text.split('<')[1].split('>')[0];
      const fromTokenAddress = tokenMap.get(fromToken);
      const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);

      const tx = await ERC20TokenContract.methods.approve(
        "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
        MaxUint256,
      )
        .send({ from: from })
        .then(tx => console.log("tx: ", tx))

      const { ex_field } = await api.smartTradingTextParse(text, from);

      const receipt = await web3.eth.sendTransaction(ex_field);
      console.log("receipt: ", receipt);
    } catch (error) {
      console.log('tokenSwap error', error)
    }
  }

  const initMembers = () => {
    if (!room) return;
    setIsDmRoom(room.isDmRoom());
    const members = room.getJoinedMembers() || [];
    const currentUserId = api._client.getUserId();
    const memberArr = members.filter(v => v.userId !== currentUserId);
    memberArr.unshift({
      name: 'room',
      isRoom: true
    })
    setMemberList(memberArr);
  }

  const upload = async (e) => {
    const file = e.target.files[0];
    const MaxUploadSize = 20 * 1024 * 1024;  // 20 MB
    if (file.size && file.size > MaxUploadSize) {
      showToast({
        type: 'info',
        msg: 'image size exceeds max 20 MB'
      })
    } else {
      try {
        let url = ""
        if (uploadFile) {
          url = await uploadFile(file)
        } else {
          url = await api._client.uploadContent(file);
        }
        await api._client.sendMessage(
          room.roomId,
          {
            body: file.name,
            msgtype: "m.image",
            url,
          },
          ""
        );
      } catch (error) {
        console.log(error)
      }
      uploadRef.current.value = "";
    }
  };

  const inputChange = (val) => { // listen text content change event in input box
    // const val = e.target.value;
    setShowInputMaxPrompt(val.length > 2000)
    if (val.length <= 2000) {
      setSendValue(val);
      // if (!isDmRoom) {
      //   setShowMemberList(/\@$/.test(val))
      // }
    }
  }

  const valueAtCheck = () => {
    let resultStr = sendValue;
    let hasAt = false;
    memberList.map(item => {
      if (resultStr.indexOf('@' + item?.name) !== -1) {
        hasAt = true;
        const reg = new RegExp("@" + item?.name, "g")
        // const address = item.userId.split(":")[1];
        // const result = `<a href=\"https://app.sending.me/#/user/@0x${address}:hs.sending.me\">${item?.name}</a>`
        const result = item?.name;
        resultStr = resultStr.replace(reg, result);
      }
    })
    return hasAt ? resultStr : "";
  }

  const handleEmojiClick = (e) => {
    e.stopPropagation();
    setShowEmojiPanel(!showEmojiPanel);
  }

  const handleEmojiItemClick = (emoji) => {
    const val = sendValue + emoji.unicode;
    setSendValue(val);
  }

  const handleAtMemberClick = (m, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const n = m?.user?.displayName || m?.name;
    let val;
    let selectionIndex = -1;
    if (atIndex >= 0 && sendValue && sendValue.length >= atIndex) {
      selectionIndex = atIndex + 1 + memberFilter.length
      const left = sendValue.slice(0, atIndex + 1);
      const right = sendValue.slice(selectionIndex, sendValue.length);
      val = left + n + ' ' + right;
      selectionIndex = atIndex + 2 + n.length;
    } else {
      val = sendValue + n + ' ';
    }
    setShowMemberList(false);
    setMemberListFocus(0);
    setSendValue(val);
    setSelectionIndex(selectionIndex);
    // setLocalInputFocus(Date.now());
  }

  const onKeyDown = async (e) => {
    const { key, keyCode } = e;
    if (['ArrowUp', 'ArrowDown'].includes(key) && showMemberList) {
      let index = memberListFocus;
      const len = filteredMembers.length - 1;
      if (key === 'ArrowDown') {
        index += 1;
        index = index > len ? 0 : index;
      } else {
        index -= 1;
        index = index < 0 ? len : index;
      }
      setMemberListFocus(index);
      e.preventDefault();
      return;
    }
    if (key === 'Enter' && keyCode === 13 && showMemberList) {
      const m = filteredMembers[memberListFocus];
      handleAtMemberClick(m);
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    // if (key === '@') {
    //   if (!isDmRoom) {
    //     if (e.currentTarget) {
    //       const { selectionStart, selectionEnd } = e.currentTarget;
    //       if (selectionStart === selectionEnd && selectionEnd > 0) {
    //         setAtIndex(selectionEnd);
    //       }
    //     }
    //     setShowMemberList(true);
    //     return
    //   }
    // }
  };

  const sendMessage = async () => {
    try {
      const formatBodyStr = valueAtCheck();
      const content = {
        body: sendValue + '',
        msgtype: "m.text",
        format: formatBodyStr ? "org.matrix.custom.html" : undefined,
        formatted_body: formatBodyStr ? formatBodyStr : undefined
      };
      console.log(sendValue);

      if (showReplyOrEditMsgDialog) {
        console.log('roomInput receive msg is ', moreOperateMsg)
        // const {event_id, sender} = moreOperateMsg.event
        // const userData = api._client.getUser(sender);
        // content.body = `> <${sender}> ${content.body}\n\n${sendValue}`
        // content.formatted_body =  `<mx-reply><blockquote><a href=\`https://app.hiseas.im/#/room/!eqX7ff3bc8wDxMc8-@sdn_ac8ca4c720fe407378d51bb95287a78a5d941a5c:ac8ca4c720fe407378d51bb95287a78a5d941a5c/$rQoLBA5gvWqcbTXluna0FLSOFnXAc4JsVEY1wKOR4-I&via=ac8ca4c720fe407378d51bb95287a78a5d941a5c&via=dab2b017b6f3e52c61d2f3fb275dae4234f072d3\">In reply to</a> <a href=\"https://app.hiseas.im/#/user/@sdn_dab2b017b6f3e52c61d2f3fb275dae4234f072d3:dab2b017b6f3e52c61d2f3fb275dae4234f072d3\">@sdn_dab2b017b6f3e52c61d2f3fb275dae4234f072d3:dab2b017b6f3e52c61d2f3fb275dae4234f072d3</a><br>${content.body}</blockquote></mx-reply>${sendValue}`
      }
      if (showReplyOrEditMsgDialog === 'reply') { // reply msg
        content['m.relates_to'] = {
          'm.in_reply_to': {
            event_id: moreOperateMsg.event.event_id
          }
        }
        console.log('-----reply-----', showReplyOrEditMsgDialog, content, replyingToUser)
      } else if (showReplyOrEditMsgDialog === 'edit') { // update msg
        content['m.new_content'] = {
          msgtype: 'm.text',
          body: sendValue + ''
        }
        content['m.relates_to'] = {
          event_id: moreOperateMsg.event.event_id,
          rel_type: 'm.replace'
        }
        console.log('-----edit-----', showReplyOrEditMsgDialog, content)
      } else { // add new msg
        console.log('-----send-----', showReplyOrEditMsgDialog, content)
      }
      setSendValue('');
      setShowReplyOrEditMsgDialog('') // should close reply/edit dialog before send msg to back end
      await api._client.sendMessage(room.roomId, content, '');

      // let text = sendValue;
      // transfer(text);
      // tokenSwap(text);
    } catch (error) {
      console.error(error, "sendMessage");
    }
  }

  const handleSendClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (sendValue) {
      sendMessage();
      setSendTimestamp(Date.now());
    }
  }

  const handleCancelReplyOfEditIcon = () => {
    setSendValue('');
    setShowReplyOrEditMsgDialog('')
    setSendTimestamp(Date.now());
  }

  return (
    <Styled styles={styles}>
      <div className="room-input-box" style={{ display: showCheckbox ? 'none' : 'flex' }}>
        {showReplyOrEditMsgDialog && (
          <div className="msg_reply_dialog">
            <div className="msg_reply_dialog_content">
              <div className="msg_reply_target_tips">
                <img className="msg_reply_tips_icon" src={showReplyOrEditMsgDialog === 'reply' ? msgReplyIcon : msgEditIcon} />
                <div className="msg_reply_tips_text">{showReplyOrEditMsgDialog === 'reply' ? `Replying to ${replyingToUser.name}` : 'Editing'}</div>
                <img className="msg_reply_tips_icon cancel" src={cancelReplyOrEditIcon} onClick={handleCancelReplyOfEditIcon} />
              </div>
              <div className="msg_reply_target_info">
                {/* const { body, msgtype, ...other } = content; */}
                {moreOperateMsg.getContent().body}
              </div>
            </div>
          </div>
        )}
        <div className="room-input-relative">
          {/* { renderTransferTip() }
          { renderTokenSwapTip() } */}

          {/* input maximum prompt */}
          {showInputMaxPrompt && (
            <div className="room-input-box-maxsize">Input charatars exceeds maximum 4000</div>
          )}

          <div className="room-input-row">
            {useRoomFuncs && useRoomFuncs.split(',').length > 0 && (
              <div
                className={["room-input-more", showMoreBox ? "room-input-more-rotate" : ""].join(" ")}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreBox(!showMoreBox)
                }}
              >
                {plusIcon}
                <input
                  ref={uploadRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={upload}
                />
              </div>
            )}

            {/* <textarea
              value={sendValue}
              id="sendMessage"
              className="room-input-box-input"
              type="text"
              autoComplete="off"
              placeholder="Send a message"
              onChange={inputChange}
              onKeyDown={sendMessage}
              maxLength={2001}
            /> */}
            <InputArea
              value={sendValue}
              placeholder="Send a message"
              inputFocus={localInputFocus}
              onChange={inputChange}
              onSelectionChanged={onSelectionChanged}
              selectionIndex={selectionIndex}
              onKeyDown={onKeyDown}
              sendMessage={sendMessage}
              sendTimestamp={sendTimestamp}
              showMemberList={showMemberList}
            />

            <div className="room-input-emoji" onClick={handleEmojiClick}>
              {emojiIcon}
            </div>

            <div className={`room-input-send${sendValue ? ' active' : ''}`} onMouseDown={handleSendClick} onTouchStart={handleSendClick}>
              {sendIcon}
            </div>
          </div>

          {/* @ show box */}
          {showMemberList && <MentionList
            room={room}
            memberList={filteredMembers}
            memberListFocus={memberListFocus}
            handleAtMemberClick={handleAtMemberClick}
          />}

          {showMoreBox && (
            <div className="room-input-more-box" onClick={(e) => e.stopPropagation()}>
              {useRoomFuncs.split(',').includes('SendImage') && (
                <div className="room-input-more-box-item" onClick={() => {
                  setShowMoreBox(false);
                  // uploadRef.current.click();
                  uploadRef.current.dispatchEvent(new MouseEvent('click'))
                }}>
                  <img src={roomInputMorePic} />
                  <span>Image</span>
                </div>
              )}
              {useRoomFuncs.split(',').includes('MoneyGun') && (
                <div className="room-input-more-box-item" onClick={() => {
                  const moneyGunUrl = `https://lucky.socialswap.com/create?st=wgsdn&roomId=${room.roomId}`
                  const url = `${moneyGunUrl}${addTimestamp(moneyGunUrl)}`
                  setShowMoreBox(false);
                  openUrlPreviewWidget(url);
                }}>
                  <img src={roomInputMoreMoney} />
                  <span>Money Gun</span>
                </div>
              )}
              {useRoomFuncs.split(',').includes('PeerSwap') && (
                <div className="room-input-more-box-item" onClick={() => {
                  const peerSwapUrl = `https://swap.socialswap.com/create?st=wgsdn&roomId=${room.roomId}`
                  const url = `${peerSwapUrl}${addTimestamp(peerSwapUrl)}`
                  setShowMoreBox(false);
                  openUrlPreviewWidget(url);
                }}>
                  <img src={roomInputMorePeerSwap} />
                  <span>PeerSwap</span>
                </div>
              )}
            </div>
          )}

          {showEmojiPanel && (
            <div className="room-input-emoji-panel" onClick={e => e.stopPropagation()}>
              {emojis.map((emoji, emojiIndex) => {
                return (
                  <div
                    className="room-input-emoji-panel-item"
                    key={emojiIndex}
                    onClick={() => handleEmojiItemClick(emoji)}
                  >
                    <span>{emoji.unicode}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Styled>
  );
};

export default React.memo(RoomInput);
