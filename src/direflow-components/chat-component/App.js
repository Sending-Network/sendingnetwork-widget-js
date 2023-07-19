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
import { dragging, filterLibrary, showToast, parseUseWidgetBtn } from "./utils/index";
import { chatWidgetBtnIcon } from "./imgs/index";

const App = (props) => {
  // console.log('widget-props-', props);
  const widgetChatRef = useRef(null);
  const widgetRootRef = useRef(null);
  let clickFlag = {};
  const [pageType, setPageType] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [curRoomId, setCurRoomId] = useState('');
  const [showWidget, setShowWidget] = useState(props.defaultShowWidget);
  const [isLoading, setIsLoading] = useState(false);
  const [btnStyle, setBtnStyle] = useState({btnPos: {}, widgetPos: {}});
  const [btnUnReadCount, setBtnUnReadCount] = useState(0);

  useEffect(() => {
    window.setShowWidget = (show) => { setShowWidget(show) };
    window.toLogout = (callback) => { handleLogout(callback) };
    window.thirdLoginWatch = () => { handleLoginSuccess() };
    window.chatToAddressWatch = (addr, callback) => { handleChatToAddress(addr, callback) };
    window.widgetChatDom = widgetChatRef.current;
    init();
    return stop;
  }, []);

  const init = async () => {
    await api.init(props.baseUrl);
    filterLibrary.init(props.filterWords);
    initDragging();
    const access_token = localStorage.getItem("sdn_access_token");
    const user_id = localStorage.getItem("sdn_user_id");
    if (!access_token || !user_id) {
      if (props.useTouristMode) {
        setPageType('touristPage');
      } else {
        setPageType('loginPage');
      }
      return;
    }
    // here has logined
    await api.getUserData();
    await start();
    setPageType('mainPage');
  }

  const initDragging = () => {
    if (!props.useWidgetBtn) return;
    const rootDom = widgetRootRef.current;
    rootDom && dragging(rootDom).enable();
    const widgetBtnStyle = parseUseWidgetBtn(
      props.useWidgetBtn,
      props.widgetWidth,
      props.widgetHeight
    );
    setBtnStyle(widgetBtnStyle);
    api.on('unReadCount', (num) => {
      if (!num) {
        setBtnUnReadCount(0);
      } else if (num !== btnUnReadCount) {
        setBtnUnReadCount(num);
      }
    })
  }

  const start = async () => {
    await api._client.startClient();
    const user = api._client.getUser(localStorage.getItem("sdn_user_id"));
    user.setWalletAddress(localStorage.getItem("sdn_user_address"));
    api._client.on("Room", onRoom);
    api._client.on("Room.myMembership", onRoom);
    api._client.on("RoomState.events", onRoom);
    api._client.on("Room.timeline", onRoom);
    api._client.on("Session.logged_out", onSessionLogout);
  };

  const stop = () => {
    api._client.removeListener("Room", onRoom);
    api._client.removeListener("RoomState.events", onRoom);
    api._client.removeListener("Room.myMembership", onRoom);
    api._client.removeListener("Room.timeline", onRoom);
    api._client.removeListener("Session.logged_out", onSessionLogout);
    api._client.stopClient();
  };

	const onRoom = () => {
    const rooms = api._client.getRooms()
    // console.log('myWidget==onRoom', rooms)
    setRooms(() => {
      return [...rooms];
    });
    api.eventEmitter && api.eventEmitter.emit && api.eventEmitter.emit('unReadCount');
  };

  const onSessionLogout = async () => {
    await stop();
    api._client.logout(() => {
      showToast({
        type: 'info',
        msg: 'Session expired',
        callback: () => {
          const keyList = ['sdn_access_token', 'sdn_user_id', 'sdn_user_address'];
          keyList.map(key => localStorage.removeItem(key));
          setRooms([]);
          api.setUserData(null);
          setPageType('loginPage');
          api.eventEmitter && api.eventEmitter.emit && api.eventEmitter.emit('logout');
        }
      });
    })
  }

  const handleLogout = async (callback) => {
    await stop();
    api._client.logout(() => {
      showToast({
        type: 'success',
        msg: 'Success',
        callback: () => {
          const keyList = ['sdn_access_token', 'sdn_user_id', 'sdn_user_address'];
          keyList.map(key => localStorage.removeItem(key));
          setRooms([]);
          api.setUserData(null);
          setPageType('loginPage');
          callback && callback();
          api.eventEmitter && api.eventEmitter.emit && api.eventEmitter.emit('logout');
        }
      });
    })
  }

  const handleLoginSuccess = async () => {
    await api.getUserData();
    await start();
    if (props.useTouristMode) {
      const touristRoomId = props.useTouristMode;
      api.joinRoom(touristRoomId, () => {
        setCurRoomId(touristRoomId);
        setPageType('roomPage');
      });
    } else {
      setPageType('mainPage');
    }
  }

  const handleChatToAddress = async (addr, callback) => {
    // to check
    const access_token = localStorage.getItem("sdn_access_token");
    const user_id = localStorage.getItem("sdn_user_id");
    if (!access_token || !user_id || !api._client || !addr) {
      showToast({
        type: 'warn',
        msg: !addr ? 'wallet address is empty' : 'please log in first'
      })
      callback(false);
      return;
    }
    // do quick chat
    setIsLoading(true);
    api.showWidget(true);
    const targetDid = await api.getUidByAddress(addr);
    let quickRoomId = null;
    if (targetDid) {
      const { dm_rooms } =  api._client.findDMRoomByUserId(targetDid);
      quickRoomId = dm_rooms && dm_rooms.length > 0 ? dm_rooms[0] : await api.createDMRoom(targetDid);
    } else {
      const { room_id } = await api._client.sendMessByWallet(addr, {})
      quickRoomId = room_id;
    }
    await checkRoomExist(quickRoomId);
    setCurRoomId(quickRoomId);
    setPageType('roomPage');
    setTimeout(() => {
      setIsLoading(false);
      callback(true);
    }, 500);
  }

  const checkRoomExist = async (_roomId) => {
    await new Promise((resolve, reject) => {
      const hasRoomInterval = setInterval(() => {
        const room = api._client.getRoom(_roomId);
        console.log('widget__interval', room);
        if (room) {
          clearInterval(hasRoomInterval);
          resolve('wasm live: success');
        }
      }, 100)
    })
  }

  const handleBtnMouseDown = (e) => {
    clickFlag.x = e.clientX;
    clickFlag.y = e.clientY;
  }

  const handleBtnMouseUp = (e) => {
    const curFlag = { x: e.clientX, y: e.clientY };
    if (Math.abs(curFlag.x - clickFlag.x) < 3 && Math.abs(curFlag.y - clickFlag.y) < 3) {
      api.showWidget(!showWidget);
      clickFlag = {};
    }
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
          loginSuccess={() => handleLoginSuccess()}
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
          "--primary-color": props.primaryColor,
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
          ...(props.useWidgetBtn ? btnStyle.btnPos : {})
        }}
        className={[props.useWidgetBtn ? "widget_root" : ""].join(" ")}
        ref={widgetRootRef}
      >
        {/* widget btn */}
        {props.useWidgetBtn && (
          <div className="chat_widget_btn"
            onMouseDown={handleBtnMouseDown}
            onMouseUp={handleBtnMouseUp}
          >
            <img src={chatWidgetBtnIcon} />
            {btnUnReadCount > 0 && (
              <div className="chat_widget_btn_bage">{btnUnReadCount > 99 ? '99+' : btnUnReadCount}</div>
            )}
          </div>
        )}
        {/* chat widget */}
        <div
          className={["chat_widget", props.useWidgetBtn ? "chat_widget_useBtn" : ""].join(" ")}
          ref={widgetChatRef}
          style={{
            display: showWidget ? 'block' : 'none',
            backgroundColor: pageType === 'loginPage' ? '#1B1D21' : props.bgColor,
            ...btnStyle.widgetPos
          }}
        >
          {isLoading ? (
            <div className="chat_widget_loading">loading...</div>
          ) : (
            renderPage()
          )}
        </div>
      </div>
    </Styled>
  );
};

App.defaultProps = {
  baseUrl: "https://portal0101.sending.network",
  defaultShowWidget: true,
  useThirdLogin: false,
  useTouristMode: "",
  useWidgetBtn: "",
  filterWords: [],
  widgetWidth: "350px",
  widgetHeight: "680px",
  widgetBoxShadow: "2px 0px 20px rgba(0, 0, 0, 0.3)",
  bgColor: "#ffffff",
  mainTextColor: "#333",
  primaryColor: '#8448E1',
  contactLastMessageTimeColor: "#B4B5B8",
  contactRoomBgColor: "red",
  leftMessageColor: "#333",
  leftMessageBgColor: "#E7EAF3",
  leftMessageTsColor: "#999",
  rightMessageColor: "#fff",
  rightMessageBgColor: "#8448E1",
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
  useWidgetBtn: PropTypes.string,
  filterWords: PropTypes.array,
  widgetWidth: PropTypes.string,
  widgetHeight: PropTypes.string,
  widgetBoxShadow: PropTypes.string,
  bgColor: PropTypes.string,
  primaryColor: PropTypes.string,
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
