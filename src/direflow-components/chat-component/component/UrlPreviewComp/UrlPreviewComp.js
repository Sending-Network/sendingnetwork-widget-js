import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./UrlPreviewComp.css";
import { api } from "../../api";

const UrlPreviewComp = (props) => {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    api.getUrlPreview(props.url, props.ts).then((res) => {
      let url = res["og:image"];
      let description = res["og:description"];
      let title = res["og:title"];
      setUrl(url);
      setTitle(title);
      setDescription(description);
    });
  }, [props.url, props.ts]);

  return (
    <Styled styles={styles}>
      <div className="urlPreviewComp">
        <a
          style={{ cursor: "pointer" }}
          onClick={() => {
            window.open(props.url)
            // props.openUrlPreviewWidget(props.url);
          }}
          className="urlPreview_url"
        >
          {props.message}
        </a>
        <div className="urlPreview_title">{title}</div>
        <div className="urlPreview_description">{description}</div>
        <img
          className="urlPreview_img"
          style={{ maxWidth: "100%" }}
          src={`${url}`}
        />
      </div>
    </Styled>
  );
};

export default UrlPreviewComp;
