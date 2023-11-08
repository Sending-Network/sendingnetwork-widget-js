import React, { useEffect, useState } from "react";
import styles from "./topFrame.css";
import { Styled } from "direflow-component";
import { api } from "../../api";
import WebviewComp from "../webViewComp/webViewComp";

const DappWhitelist = ['events.sending.network'];

const checkUrl = (url) => {
  try {
    let u = new URL(url);
    if (u.hostname == 'localhost') {
      return url
    }
    if (DappWhitelist.indexOf(u.host) > -1) {
      return url
    }
    console.log('no access: ' + url);
  } catch (error) {
    console.log('error url: ' + url);
  }
  return 'https://www.sending.network/';
}

const TopFrame = ({ pageType, openDappUrl }) => {
  const [showWebview, setShowWebview] = useState(!!openDappUrl);
  const [webviewUrl, setWebviewUrl] = useState(checkUrl(openDappUrl));
  const [binded, setBinded] = useState(false);

  useEffect(() => {
    if (api && api.eventEmitter && !binded) {
      api.eventEmitter.on('openDappUrl', openUrlAtTop);
      api.eventEmitter.on('closeDappUrl', closeUrlAtTop);
      setBinded(true);
    }
  }, [pageType])

  const openUrlAtTop = (url) => {
    setShowWebview(true);
    setWebviewUrl(checkUrl(url));
  }

  const closeUrlAtTop = () => {
    setShowWebview(false);
    setWebviewUrl(null);
  }

  return (
    <Styled styles={styles}>
      <div className="top-frame">
        {showWebview && (
          <WebviewComp
            url={webviewUrl}
            closeUrlPreviewWidget={() => setShowWebview(false)}
          />
        )}
      </div>
    </Styled>
  );
}

export default React.memo(TopFrame)