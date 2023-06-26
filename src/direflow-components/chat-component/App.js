import React, { useEffect, useRef, useState } from "react";
import LoginPage from "./component/loginPage/loginPage";
import MainPage from './component/mainPage/mainPage';
import RoomPage from './component/roomPage/roomPage';
import InvitePage from './component/invitePage/invitePage';
import SetPage from './component/setPage/setPage';
import TouristPage from './component/touristPage/touristPage';
import PropTypes from "prop-types";
import styles from "./App.css";
import { Styled } from "direflow-component";
import { api } from "./api";
import { filterLibrary, showToast } from "./utils/index";

const App = (props) => {
  // console.log('widget-props-', props);
  const widgetRootRef = useRef(null);
  const [pageType, setPageType] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [curRoomId, setCurRoomId] = useState('');
  const [showWidget, setShowWidget] = useState(props.defaultShowWidget);

  useEffect(() => {
    window.setShowWidget = (show) => { setShowWidget(show) };
    window.toLogout = (callback) => { handleLogout(callback) };
    window.widgetRootDom = widgetRootRef.current;
    init();
    return stop;
  }, []);

  const init = () => {
    api.init(props.baseUrl);
    filterLibrary.init(props.filterWords);
    const access_token = localStorage.getItem("sdn_access_token");
    const user_id = localStorage.getItem("sdn_user_id");
    if (access_token && user_id) {
      setPageType('mainPage');
      start();
    } else if (props.useTouristMode) {
      setPageType('touristPage');
    } else {
      setPageType('loginPage');
    }
  }

  const start = async () => {
    await api._client.startClient();
    const user = api._client.getUser(localStorage.getItem("sdn_user_id"));
    user.setWalletAddress(localStorage.getItem("sdn_user_address"));
    api._client.on("Room", onRoom);
    api._client.on("Room.myMembership", onRoom);
    api._client.on("RoomState.events", onRoom);
    api._client.on("Room.timeline", onRoom);
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
    // console.log('myWidget==onRoom', rooms)
    setRooms(() => {
      return [...rooms];
    });
  };

  const handleLogout = async (callback) => {
    await stop();
    api._client.logout(() => {
      const keyList = ['sdn_access_token', 'sdn_user_id', 'sdn_user_address'];
      keyList.map(key => localStorage.removeItem(key));
      setRooms([]);
      showToast({
        type: 'success',
        msg: 'Operation successful',
        callback: () => {
          setPageType('loginPage');
          callback && callback();
        }
      });
    })
  }

  const renderPage = () => {
    switch (pageType) {
      case 'touristPage': 
        return <TouristPage
          baseUrl={props.baseUrl}
          roomId={props.useTouristMode}
          toLogin={() => setPageType('loginPage')}
        />;
      case 'loginPage': 
        return <LoginPage
          useThirdLogin={props.useThirdLogin}
          useTouristMode={props.useTouristMode}
          loginSuccess={() => {
            init();
            setPageType('mainPage')
          }}
          backToTourist={() => setPageType('touristPage')}
        />;
      case 'mainPage':
        return <MainPage
          rooms={rooms}
          goToRoom={(roomId) => {
            setCurRoomId(roomId)
            setPageType('roomPage')
          }}
          onMenuClick={(type) => {
            switch (type) {
              case 'create': setPageType('invitePage'); break;
              case 'set': setPageType('setPage'); break;
              case 'logout': handleLogout(); break;
            }
          }}
        />
      case 'roomPage':
        return <RoomPage roomId={curRoomId} callback={() => {
          setCurRoomId("")
          setPageType('mainPage')
        }} />
      case 'invitePage':
        return <InvitePage onBack={() => setPageType('mainPage')} />
      case 'setPage':
        return <SetPage onBack={() => setPageType('mainPage')} />
      default:
        return null
    }
  }

  return (
    <Styled styles={styles}>
      <div
        style={{
          "--widget-width": props.widgetWidth,
          "--widget-height": props.widgetHeight,
          "--widget-box-shadow": props.widgetBoxShadow,
          "--bg-color": props.bgColor,
          "--main-text-color": props.mainTextColor,
          "--contact-last-message-time-color": props.contactLastMessageTimeColor,
          "--contact-room-bg-color": props.contactRoomBgColor,
          "--left-message-color": props.leftMessageColor,
          "--left-message-bg-color": props.leftMessageBgColor,
          "--left-message-ts-color": props.leftMessageTsColor,
          "--right-message-color": props.rightMessageColor,
          "--right-message-bg-color": props.rightMessageBgColor,
          "--right-message-ts-color": props.rightMessageTsColor,
          "--sendMessage-bg-color": props.sendMessageBgColor,
          "--message-sender-color": props.messageSenderColor,
          "--sendMessage-border-color": props.sendMessageBorderColor,
        }}
      >
        <div
          className="chat_widget"
          ref={widgetRootRef}
          style={{
            display: showWidget ? 'block' : 'none',
            backgroundColor: pageType === 'loginPage' ? '#1B1D21' : props.bgColor,
          }}
        >
          { renderPage() }
        </div>
      </div>
    </Styled>
  );
};

App.defaultProps = {
  baseUrl: "http://localhost",
  defaultShowWidget: true,
  useThirdLogin: false,
  useTouristMode: "",
  filterWords: [],
  widgetWidth: "350px",
  widgetHeight: "680px",
  widgetBoxShadow: "0px 4px 20px rgba(0, 0, 0, 0.3)",
  bgColor: "#EAECEE",
  mainTextColor: "#333",
  contactLastMessageTimeColor: "#B4B5B8",
  contactRoomBgColor: "red",
  leftMessageColor: "#333",
  leftMessageBgColor: "#fff",
  leftMessageTsColor: "#999",
  rightMessageColor: "#fff",
  rightMessageBgColor: "#227A60",
  rightMessageTsColor: "rgba(255, 255, 255, 0.5)",
  sendMessageBgColor: "#fff",
  messageSenderColor: "#333",
  sendMessageBorderColor: "#fff"
};

App.propTypes = {
  baseUrl: PropTypes.string,
  defaultShowWidget: PropTypes.bool,
  useThirdLogin: PropTypes.bool,
  useTouristMode: PropTypes.string,
  filterWords: PropTypes.array,
  widgetWidth: PropTypes.string,
  widgetHeight: PropTypes.string,
  widgetBoxShadow: PropTypes.string,
  bgColor: PropTypes.string,
  mainTextColor: PropTypes.string,
  contactLastMessageTimeColor: PropTypes.string,
  contactRoomBgColor: PropTypes.string,
  leftMessageColor: PropTypes.string,
  leftMessageBgColor: PropTypes.string,
  leftMessageTsColor: PropTypes.string,
  rightMessageColor: PropTypes.string,
  rightMessageBgColor: PropTypes.string,
  rightMessageTsColor: PropTypes.string,
  sendMessageBgColor: PropTypes.string,
  messageSenderColor: PropTypes.string,
  sendMessageBorderColor: PropTypes.string,
};

export default App;
