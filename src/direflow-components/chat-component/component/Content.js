import React, { useEffect, useMemo, useRef, useState } from "react";
import Rooms from "./mainPage/roomList/Rooms";
import RoomView from "./roomPage/roomView/roomView";
import styles from "./Content.css";
import { Styled } from "direflow-component";
import { api } from "../api";
import { titleBgUrl } from "../imgs/index";
import UrlPreviewWidget from "./UrlPreviewWidget";
import Profile from "./Profile";

const Content = () => {
  const [rooms, setRooms] = useState([]);
  const [curRoomId, setCurRoomId] = useState("");
  const [curRoomName, setCurRoomName] = useState("");
  const [showUrlPreviewWidget, setShowUrlPreviewWidget] = useState(false);
  const [urlPreviewWidgetUrl, setUrlPreviewWidgetUrl] = useState("");
  const [componentType, setComponentType] = useState("0");
  const [dapps, setDapps] = useState([]);

  useEffect(() => {
    start();
    // queryDapps();
    return stop;
  }, []);

  const start = async () => {
    await api._client.startClient();
    const user = api._client.getUser(localStorage.getItem("sdn_user_id"));
    if (user) {
      user.setWalletAddress(localStorage.getItem("sdn_user_address"));
      api._client.on("Room", onRoom);
      api._client.on("Room.myMembership", onRoom);
      api._client.on("RoomState.events", onRoom);
      api._client.on("Room.timeline", onRoom);
    }
  };

  const stop = () => {
    api._client.removeListener("Room", onRoom);
    api._client.removeListener("RoomState.events", onRoom);
    api._client.removeListener("Room.myMembership", onRoom);
    api._client.removeListener("Room.timeline", onRoom);
    api._client.stopClient();
  };

  const onRoom = () => {
    const rooms = api._client.getRooms()
    // .filter((room) => {
    //   return room.getMyMembership() === "join";
    // });
    setRooms(() => {
      return [...rooms];
    });
  };

  const queryDapps = async () => {
    const res = await api.queryMessageType();
    setDapps(Object.values(res));
  };

  const enterRoom = (roomId) => {
    const room = api._client.getRoom(roomId);
    if (room) {
      const events = room.getLiveTimeline().getEvents();
      if (events.length) {
        api._client.sendReadReceipt(events[events.length - 1]);
      }
    }
    const curRoom = rooms.find((room) => roomId === room.roomId);
    if (curRoom) {
      setComponentType("1");
      setCurRoomName(curRoom.name);
      setCurRoomId(roomId);
    }
  };

  const openUrlPreviewWidget = (url) => {
    setShowUrlPreviewWidget(true);
    setUrlPreviewWidgetUrl(url);
  };

  const closeUrlPreviewWidget = (url) => {
    setShowUrlPreviewWidget(false);
    setUrlPreviewWidgetUrl("");
  };

  const formatName = (roomName) => {
    if (roomName) {
      if (roomName.length > 13) {
        return `${roomName.slice(0, 5)}...${roomName.slice(
          roomName.length - 5
        )}`;
      }
      return roomName;
    }
  };

  const renderTitle = () => {
    let title = null;

    switch (componentType) {
      case "0":
        title = (
          <div className="chat_widget_content_title componentType_0">
            <span
              onClick={() => {
                setComponentType("2");
              }}
              style={{ cursor: "pointer" }}
            >
              Sending.Network
            </span>
            <img className="chat_widget_content_title_bg" src={titleBgUrl} />
          </div>
        );
        break;
      case "1":
        title = (
          <div className="chat_widget_content_title">
            <svg
              onClick={back}
              style={{
                cursor: "pointer",
              }}
              viewBox="64 64 896 896"
              focusable="false"
              data-icon="left"
              width="17px"
              height="17px"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path>
            </svg>
            <span>{formatName(curRoomName)}</span>
            <span style={{ paddingRight: 17 }}></span>
            <img className="chat_widget_content_title_bg" src={titleBgUrl} />
          </div>
        );
        break;
      case "2":
        title = (
          <div className="chat_widget_content_title componentType_0">
            <span
              onClick={() => {
                setComponentType("0");
              }}
              style={{ cursor: "pointer" }}
            >
              Sending.Network
            </span>
            <img className="chat_widget_content_title_bg" src={titleBgUrl} />
          </div>
        );
        break;
      default:
        break;
    }

    return title;
  };

  const renderBody = () => {
    let body = null;

    switch (componentType) {
      case "0":
        body = <Rooms rooms={rooms} enterRoom={enterRoom} />;
        break;

      case "1":
        body = (
          <RoomView
            roomId={curRoomId}
            openUrlPreviewWidget={openUrlPreviewWidget}
            dapps={dapps}
          />
        );
        break;
      case "2":
        body = <Profile />;
        break;

      default:
        break;
    }

    return body;
  };

  const renderUrlPreviewWidget = () => {
    if (showUrlPreviewWidget)
      return (
        <UrlPreviewWidget
          url={urlPreviewWidgetUrl}
          closeUrlPreviewWidget={closeUrlPreviewWidget}
        />
      );
    return null;
  };

  const render = () => {
    return (
      <div className="chat_widget_content">
        {renderTitle()}
        {renderBody()}
        {renderUrlPreviewWidget()}
      </div>
    );
  };

  return <Styled styles={styles}>{render()}</Styled>;
};

export default Content;
