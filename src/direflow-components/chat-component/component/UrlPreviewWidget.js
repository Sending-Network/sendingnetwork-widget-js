import styles from "./UrlPreviewWidget.css";
import { pick, isEmpty } from "lodash";
import { Styled } from "direflow-component";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { urlPreviewClose } from "../imgs/index";
import Postmate from "postmate";
import { api } from "../api";

let postmateRef = null;

const UrlPreviewWidget = ({ closeUrlPreviewWidget, url }) => {
  const frameContainerRef = useRef(null);

  useEffect(() => {
    renderFrame();
    return () => {
      destroyFrame();
    };
  }, []);

  const actionMethods = (payload) => {
    if (payload.action === "getMyProfile") {
      const { displayName, userId, walletAddress } = api._client.getUser(
        api._client.getUserId()
      );
      payload.callback({
        id: payload.id,
        data: { name: displayName, userId, walletAddress },
      });
    }
    if (payload.action === "getRoomInfo") {
      const { roomId } = payload.data;
      const room = api._client.getRoom(roomId);
      if (room) {
        const members = room.getJoinedMembers().map((member) => {
          return {
            nickName: member.nickName,
            user: {
              name: member.user.displayName,
              userId: member.user.userId,
              walletAddress: member.user.walletAddress,
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
    postmateRef = new Postmate({
      url,
      container: frameContainerRef.current,
      classListArray: ["iframe"],
    });

    bindPostmate();
  };

  const destroyFrame = async () => {
    await postmateRef.then((child) => {
      child.destroy();
    });
    postmateRef = null;
  };

  return (
    <Styled styles={styles}>
      <div className="UrlPreviewWidget">
        <div className="handleFun">
          <img src={urlPreviewClose} onClick={closeUrlPreviewWidget} />
        </div>
        <div className="iframeContainer" ref={frameContainerRef}></div>
      </div>
    </Styled>
  );
};

export default UrlPreviewWidget;
