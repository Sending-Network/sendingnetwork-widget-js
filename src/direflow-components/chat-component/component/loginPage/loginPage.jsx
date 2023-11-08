import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./loginPage.css";
import { api } from "../../api";
import {
  sendingMelogo,
  metaMasklogo,
  loginPageBg,
} from "../../imgs/login";
import { roomTitleBackIcon } from "../../imgs/index";
import { showToast } from "../../utils/index";

const LoginPage = ({ useTouristMode, useThirdLogin, loginSuccess, backToTourist }) => {
  const [showAutoLogin, setShowAutoLogin] = useState(false);

  useEffect(() => {
    if (useThirdLogin) {
      const access_token = localStorage.getItem("sdn_access_token");
      const user_id = localStorage.getItem("sdn_user_id");
      if (access_token && user_id) {
        setShowAutoLogin(false);
        loginSuccess()
      } else {
        setShowAutoLogin(true);
      }
    } else {
      setShowAutoLogin(false);
    }
  }, [])

  const handleLoginClick = () => {
    setShowAutoLogin(true);
    api.DIDLogin((res) => {
      if (res) {
        loginSuccess();
      } else {
        showToast({
          type: 'warn',
          msg: 'failed, please try again',
          duration: 2000
        })
        setShowAutoLogin(false);
      }
    });
  };

  return (
    <Styled styles={styles}>
      <div className="loginPage" style={{backgroundImage: `url(${loginPageBg})`}}>

        {useTouristMode && (
          <div className="loginPage-backIcon" onClick={() => backToTourist()}>
            <img src={roomTitleBackIcon} />
          </div>
        )}

        <div className="loginPage-logo">
          <img src={sendingMelogo} />
          <p>SendingNetwork</p>
        </div>

        {showAutoLogin ? (
          <div className="login-ing">Logging in ...</div>
        ) : (
          <div className="login-btn" onClick={handleLoginClick}>
            <img src={metaMasklogo} />
            <p>Log in with MetaMask</p>
          </div>
        )}

        <div className="login-power">Powered by SendingNetwork</div>
      </div>
    </Styled>
  );
};

export default LoginPage;
