import React, { useEffect, useState, useRef } from "react";
import sdk from "sendingnetwork-js-sdk";
import { Styled } from "direflow-component";
import styles from "./touristPage.css";
import { api } from '../../api';
import { showToast } from "../../utils/index";
import TouristRoom from "./touristRoom/touristRoom";


const TouristPage = ({ baseUrl, roomId, toLogin }) => {
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    if (!api.getTouristClient()) {
      await initToken();
      await initClient();
    }
    setCanShow(true);
  }

  const initToken = async () => {
    try {
      const url = baseUrl + '/_api/client/unstable/did/tourist';
      const { access_token, user_id } = await fetch(url, {}).then(response => response.json());
      localStorage.setItem('sdn_tourist_token', access_token);
      localStorage.setItem('sdn_tourist_userId', user_id);
    } catch (error) {
      showToast({
        type: 'error',
        msg: error
      })
    }
  }

  const initClient = async () => {
    const _client = sdk.createClient({
      baseUrl,
      userId: localStorage.getItem('sdn_tourist_userId'),
      accessToken: localStorage.getItem('sdn_tourist_token'),
      unstableClientRelationAggregation: true
    });
    api.setTouristClient(_client);
  }

  return (
    <Styled styles={styles}>
      {canShow ? (
        <TouristRoom
          baseUrl={baseUrl}
          roomId={roomId}
          toLogin={toLogin}
        />
      ) : (
        <div className="touristPage_loading">Waiting for load...</div>
      )}
		</Styled>
  );
};

export default TouristPage;
