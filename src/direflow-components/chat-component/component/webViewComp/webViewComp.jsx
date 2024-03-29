import React, { useEffect, useRef, useState } from "react";
import { isEmpty } from "lodash";
import Postmate from "postmate";
import Web3 from "web3";
import * as util from "ethereumjs-util";
import { Styled } from "direflow-component";
import styles from "./webViewComp.css";
import { webviewCloseIcon, webviewShareIcon } from "../../imgs/index";
import { getDidByUserId, showToast, getAddressByUserId } from "../../utils/index";
import { api } from "../../api";
import ShareComp from "../shareComp/shareComp";

let postmateRef = null;
const web3 = new Web3();

const WebviewComp = ({ closeUrlPreviewWidget, url }) => {
  const frameContainerRef = useRef(null);
  const [showSharePage, setShowSharePage] = useState(false);

  useEffect(() => {
    renderFrame();
    return () => {
      destroyFrame();
    };
  }, []);

  const actionMethods = async (payload) => {
    console.log('widget___payload', payload);
    if (payload.action === "getMyProfile") {
      const userId = api.getUserId();
      const { displayname, wallet_address, avatar_url } = await api.getUserData();
      payload.callback({
        id: payload.id,
        data: {
          userId,
          name: displayname,
          avatarUrl: api._client.mxcUrlToHttp(avatar_url),
          walletAddress: wallet_address,
          did: getDidByUserId(userId)
        },
      });
    }
    if (payload.action === "getRoomInfo") {
      const { roomId } = payload.data;
      const room = api._client.getRoom(roomId);
      if (room) {
        const members = room.getJoinedMembers().map((member) => {
          return {
            nickName: member.name,
            user: {
              name: member.name,
              userId: member.userId,
              walletAddress: getAddressByUserId(member.userId),
            },
          };
        });
        payload.callback({
          id: payload.id,
          data: { name: room.name, members, roomId },
        });
      } else {
        payload.callback({
          id: payload.id,
          error: {
            code: 40000,
            message: `room ${roomId} dose not exist`,
          },
        });
      }
    }
    if (payload.action === "sendMessage") {
      const { roomId, content } = payload.data;
      const room = api._client.getRoom(roomId);
      if (room) {
        if (!isEmpty(content)) {
          api._client.sendMessage(roomId, content);
          payload.callback({
            id: payload.id,
            data: { code: 200, message: "message send success" },
          });
        } else {
          payload.callback({
            id: payload.id,
            error: {
              code: 40001,
              message: `message dose not empty`,
            },
          });
        }
      } else {
        payload.callback({
          id: payload.id,
          error: {
            code: 40000,
            message: `room ${roomId} dose not exist`,
          },
        });
      }
    }
    if (payload.action === "sendEvent") {
      const { roomId, content } = payload.data;
      const room = api._client.getRoom(roomId);
      if (room) {
        if (!isEmpty(content)) {
          api._client.sendEvent(
            roomId,
            "m.room.customized_events",
            content
          );
          payload.callback({
            id: payload.id,
            data: { code: 200, message: "message send success" },
          });
        } else {
          payload.callback({
            id: payload.id,
            error: {
              code: 40001,
              message: `message dose not empty`,
            },
          });
        }
      } else {
        payload.callback({
          id: payload.id,
          error: {
            code: 40000,
            message: `room ${roomId} dose not exist`,
          },
        });
      }
    }
    if (payload.action === "getUserProfile") {
      const user = api._client.getUser(payload.data.userId);
      if (user) {
        const { name, userId, walletAddress } = user;
        payload.callback({
          id: payload.id,
          data: { user: { name, userId, walletAddress } },
        });
      } else {
        payload.callback({
          id: payload.id,
          error: {
            code: 40000,
            message: `user ${payload.data.userId} dose not exist`,
          },
        });
      }
    }
    if (payload.action === "emoji_show") {
      showToast({
        type: 'info',
        msg: 'widget current not support'
      })
    }
    if (payload.action === "sendSuccess") {
      payload.callback({
        id: payload.id,
        data: {},
      });
      setTimeout(() => {
        closeUrlPreviewWidget();
      }, 1.5 * 1000)
    }
    // sign for wallet message
    if (payload.action === "signWithMessage") {
      const { message } = payload.data;
      const privateKey = localStorage.getItem('sdn_web3_key');
      if (!privateKey) {
        showToast({
          type: 'warn',
          msg: 'lack privateKey, please try login',
          callback: () => {
            api.logout();
          }
        })
      } else {
        try {
          const msg = privateKey.replace('0x', '');
          const address = `0x${util.privateToAddress(Buffer.from(msg, 'hex')).toString('hex')}`;
          web3.eth.accounts.wallet.add(privateKey);
          const sign = web3.eth.sign(message, address);
          sign.then(signature => {
            payload.callback({
              id: payload.id,
              data: { code: 200, sign: signature },
            });
          }).catch(err => {
            throw err;
          })
        } catch (error) {
          payload.callback({
            id: payload.id,
            error: { code: 40000, message: `something went wrong`},
          });
        }
      }
    }
    if (payload.action == "didLogin") {
      api.DIDLogin((res)=>{
        payload.callback({id:payload.id, data:res});
        window.thirdLoginWatch();
      });
    }
    if (payload.action == "thirdRegister") {
      const data = payload.data;
      api.thirdRegister(data, (res)=>{
        payload.callback({id:payload.id, data:res});
      }, (e)=>{
        payload.callback({
          id: payload.id,
          error: { code: 40000, message: `thirdRegister failed`}
        })
      });
    }
    if (payload.action == "getProfileInfo") {
      const {userId} = payload.data;
      api._client.getProfileInfo(userId).then(value=>{
        const {displayname, avatar_url, wallet_address} = value;
        payload.callback({
          id: payload.id,
          data: {displayname, avatar_url, wallet_address}
        })
      }).catch(e=>{
        payload.callback({
          id: payload.id,
          error: { code: 40000, message: `something went wrong`}
        })
      })
    }
  };

  const bindPostmate = () => {
    postmateRef.then((child) => {
      child.on("message.sending.me", ({ payload }) => {
        if (payload?.id) {
          payload.callback = (data) => {
            child.call("message.sending.me", data);
          };
        }
        actionMethods(payload);
      });
    });
  };

  const renderFrame = () => {
    if (!url) {
      return
    }
    postmateRef = new Postmate({
      url,
      container: frameContainerRef.current,
      classListArray: ["iframe"],
    });

    bindPostmate();
  };

  const destroyFrame = async () => {
    if (postmateRef) {
      await postmateRef.then((child) => {
        child.destroy();
      });
      postmateRef = null;
    }
  };

  return (
    <Styled styles={styles}>
      <div className="widget_webViewComp">
        <div className="handleFun">
          <div className="handleFun_item" onClick={() => setShowSharePage(true)}>
            <img src={webviewShareIcon} />
          </div>
          <div className="handleFun_item" onClick={closeUrlPreviewWidget}>
            <img src={webviewCloseIcon} />
          </div>
        </div>
        <div className="iframeContainer" ref={frameContainerRef}></div>
        {/* share page */}
        {showSharePage && (
          <ShareComp link={url} onBack={() => setShowSharePage(false)} />
        )}
      </div>
    </Styled>
  );
};

export default WebviewComp;

export const addTimestamp = (url) => {
  const timestampWhiteList = ["socialswap.com", "web3-tp.net"];
  const shouldAddTimestamp = (url) => {
    return url && timestampWhiteList.some((item) => url.includes(item));
  };
  return shouldAddTimestamp(url)
    ? `${url.includes("?") ? "&" : "?"}_t=${~~(
          Date.now() /
          (1000 * 60 * 60 * 24)
      )}`
    : "";
};
