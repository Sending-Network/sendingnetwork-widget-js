import React, { useEffect, useState, useRef } from "react";
import { Styled } from "direflow-component";
import styles from "./roomInput.css";
import Web3 from "web3";
import { MaxUint256 } from "@ethersproject/constants";
import { api } from "../../../../api";
import { roomInputUploadIcon } from "../../../../imgs/index";
import { web3ContractConstant, tokenList } from "../../../../utils/index";
import { checkChain } from "../../../../utils/gasFee";
import { AvatarComp } from "../../../avatarComp/avatarComp";

const RoomInput = ({ roomId }) => {
  const ethereum = window.ethereum;
  const web3 = new Web3(ethereum);
  const uploadRef = useRef(null);
  const [sendValue, setSendValue] = useState("");
  const [transferCount, setTransferCount] = useState(0);
  const [showTransferTip, setShowTransferTip] = useState(false);
  const [tokenSwapCount, setTokenSwapCount] = useState(0);
  const [showTokenSwapTip, setShowTokenSwapTip] = useState(false);
  
  const [showMemberList, setShowMemberList] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [memberListFocus, setMemberListFocus] = useState(0);

  useEffect(() => {
    initMembers();
  }, [roomId])

  // useEffect(() => {
  //   handleTransferTip()
  //   handleTokenSwapTip()
  // }, [sendValue]);

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
                    api._client.sendEvent(
                      roomId,
                      "m.room.message",
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

              ethereum
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
                  api._client.sendEvent(
                    roomId,
                    "m.room.message",
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
      } catch (error) {}
    }
  };

  const tokenMap = new Map(tokenList);

  const tokenSwap = async (text) => {
    if (text.indexOf("$TokenSwap") === -1) return;
    const erc20abi= [{ "inputs": [ { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "symbol", "type": "string" }, { "internalType": "uint256", "name": "max_supply", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "approve", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" } ], "name": "decreaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" } ], "name": "increaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transfer", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }]
    const [ from ] = await web3.eth.getAccounts();
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
    if (!roomId) return;
    const room = api._client.getRoom(roomId);
    const members = room.getJoinedMembers();
    const currentUserId = api._client.getUserId();
    const memberArr = members.filter(v => v.userId !== currentUserId);
    setMemberList(memberArr);
  }

  const upload = async (e) => {
    const file = e.target.files[0];
    try {
      const url = await api._client.uploadContent(file);
      await api._client.sendEvent(
        roomId,
        "m.room.message",
        {
          body: file.name,
          msgtype: "m.image",
          url,
        },
        ""
      );
    } catch (error) {}
    uploadRef.current.value = "";
  };

  const inputChange = (e) => {
    const val = e.target.value;
    setSendValue(val);
    setShowMemberList(/\@$/.test(val))
  }

  const valueAtCheck = async () => {
    let resultStr = sendValue;
    let hasAt = false;
    memberList.map(item => {
      if (resultStr.indexOf('@'+item.name) !== -1) {
        hasAt = true;
        const reg = new RegExp("@"+item.name, "g")
        const address = item.userId.split(":")[1];
        const result = `<a href=\"https://app.sending.me/#/user/@0x${address}:hs.sending.me\">${item.name}</a>`
        resultStr = resultStr.replace(reg, result);
      }
    })
    return hasAt ? resultStr : "";
  }

  const sendMessage = async ( e ) => {
    const { key } = e;
    if (['ArrowUp', 'ArrowDown'].includes(key) && showMemberList) {
      let index = memberListFocus;
      const len = memberList.length - 1;
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
    if (key === 'Enter' && showMemberList) {
      const m = memberList[memberListFocus];
      const val = sendValue + m.name + " ";
      setShowMemberList(false);
      setMemberListFocus(0);
      setSendValue(val);
      return;
    }
    if (key == "Enter" && sendValue.trim()) {
      try {
        const formatBodyStr = await valueAtCheck();
        const content = {
          body: sendValue,
          msgtype: "m.text",
          format: formatBodyStr ? "org.sdn.custom.html" : undefined,
          formatted_body: formatBodyStr ? formatBodyStr : undefined
        };
        setSendValue("");
        await api._client.sendEvent(roomId, "m.room.message", content, "");
        // let text = sendValue;
        // transfer(text);
        // tokenSwap(text);
      } catch (error) {
        console.log(error, "sendMessage");
      }
    }
  };

  return (
    <Styled styles={styles}>
      <div className="room-input-box">
          {/* { renderTransferTip() }
          { renderTokenSwapTip() } */}

          {/* @ show box */}
          {showMemberList && (
            <div className="room-input_at">
              {memberList.map((m, mIndex) => {
                return (
                  <div
                    key={m.userId}
                    className={[
                      "room-input_at_item",
                      mIndex === memberListFocus && "room-input_at_item_bgFocus"
                    ].join(' ')}
                  >
                    <div className="room-input_at_item_avatar">
                      <AvatarComp url={m?.user?.avatarUrl} />
                    </div>
                    <div className="room-input_at_item_name">{m.name}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* pic-upload */}
          <div className="room-input-box-upload" onClick={() => uploadRef.current.click()}>
            <img src={roomInputUploadIcon} />
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={upload}
            />
          </div>

          {/* input */}
          <input
            value={sendValue}
            id="sendMessage"
            className="room-input-box-input"
            type="text"
            autoComplete="off"
            placeholder="Message"
            onChange={inputChange}
            onKeyDown={sendMessage}
          />
        </div>
		</Styled>
  );
};

export default RoomInput;
