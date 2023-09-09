import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./UrlPreviewComp.css";
import { api } from "../../api";
import { renderTs } from "../../utils/index";

const UrlPreviewComp = (props) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    api.getUrlPreview(props.url, props.ts).then((res) => {
      const isMoneyGun = res['og:site_nam'] === 'Money Gun';
      let url = res["og:image"];
      let description = res["og:description"];
      let title = res["og:title"];
      if (res.nft_meta && res.nft_meta.contract_address) {
        url = res.nft_meta.image_url;
        description = res.nft_meta.description;
      }
      if (url && /^mxc\:\/\/.+/.test(url)) {
        url = api._client.mxcUrlToHttp(url);
      }
      if (isMoneyGun) {
        url = 'https://hs.sending.me/_api/media/r0/download/hs.sending.me/TeqfFZWpSpFrwSUnNHlVhCDS';
      }
      setUrl(url);
      setTitle(title);
      setDescription(description);
    });
  }, [props.url, props.ts]);

  const handleClick = () => {
    // window.open(props.url)
    props.openUrlPreviewWidget(props.url);
  }

  return (
    <Styled styles={styles}>
      <div
        className="urlPreviewComp"
        style={{alignItems: props.isRight ? "flex-end" : "flex-start"}}
      >
        <div className={props.isRight ? "urlPreview_url_right" : "urlPreview_url_left"}>
          <a className={props.isRight ? "urlPreview_url_a_right" : "urlPreview_url_a_left"} onClick={handleClick}>{props.message}</a>
          <span className={["urlPreview_url_time", props.isRight && "urlPreview_url_time_right"].join(" ")}>{renderTs(props.ts)}</span>
        </div>
        {(url || title || description) && (
          <div className="urlPreview_card" onClick={handleClick}>
            {url && (
              <img
                className="urlPreview_card_img"
                style={{ maxWidth: "100%" }}
                src={`${url}`}
              />
            )}
            {title && (<div className={props.isRight ? "urlPreview_card_title_right" : "urlPreview_card_title_left"}>{title}</div>)}
            {description && (<div className="urlPreview_card_description">{description}</div>)}
          </div>
        )}
      </div>
    </Styled>
  );
};

export default UrlPreviewComp;
