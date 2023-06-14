import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./loginPage.css";
import { api } from "../../api";
import {
  sendingMelogo,
  metaMasklogo,
  loginBgCircle1,
  loginBgCircle2,
  loginBgCircle3
} from "../../imgs/login";

const LoginPage = ({ useThirdLogin, loginSuccess }) => {
  const [showAutoLogin, setShowAutoLogin] = useState(false);

  useEffect(() => {
    if (useThirdLogin) {
      window['thirdLoginWatch'] = () => {
        loginSuccess();
      }
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
      }
      setShowAutoLogin(false);
    });
  };

  return (
    <Styled styles={styles}>
      <div className="loginPage">
        <img className="loginPage-bg-1" src={loginBgCircle1} />
        <img className="loginPage-bg-2" src={loginBgCircle2} />
        <img className="loginPage-bg-3" src={loginBgCircle3} />

        <div className="loginPage-logo">
          <img src={sendingMelogo} />
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
