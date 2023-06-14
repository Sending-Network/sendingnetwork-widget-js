import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./avatarComp.css";
import { morePagePersonIcon } from "../../imgs/index";
import { api } from "../../api";

export const AvatarComp = ({ url = "" }) => {
  const [avatarUrl, setAvatarUrl] = useState(false);

  useEffect(() => {
    if (/(http|https):\/\/([\w.]+\/?)\S*/.test(url)) {
      setAvatarUrl(url)
    } else {
      const avatar_http = api._client.mxcUrlToHttp(url);
      setAvatarUrl(avatar_http)
    }
  }, [url])

  return (
    <Styled styles={styles}>
      <div className="avatar-comp" style={{backgroundImage: 'url('+ morePagePersonIcon +')'}}>
        {avatarUrl && (<img className="avatar-comp_img" src={avatarUrl} />)}
			</div>
		</Styled>
  );
};


export const AvatarMutiComp = ({ urls = [] }) => {
  const [listArr, setListArr] = useState([]);

  useEffect(() => {
    const resultArr = [];
    urls.map(item => {
      if (/(http|https):\/\/([\w.]+\/?)\S*/.test(item)) {
        resultArr.push(item);
      } else {
        const avatar_http = api._client.mxcUrlToHttp(item);
        resultArr.push(avatar_http);
      }
    })
    setListArr(resultArr)
  }, [])

  return (
    <Styled styles={styles}>
      <div className="avatar-mult-comp">
        {/* 3 pic */}
        {listArr.length == 3 && (
          <div className="avatar-mult-comp-3">
            <div className="avatar-mult-comp-3_top" style={{backgroundImage: 'url('+ morePagePersonIcon +')'}}>
              {listArr[0] && (<img src={listArr[0]} />)}
            </div>
            <div className="avatar-mult-comp-3_bottom">
              <div className="avatar-mult-comp-3_bottom_item" style={{backgroundImage: 'url('+ morePagePersonIcon +')'}}>
                {listArr[1] && (<img src={listArr[1]} />)}
              </div>
              <div className="avatar-mult-comp-3_bottom_item" style={{backgroundImage: 'url('+ morePagePersonIcon +')'}}>
                {listArr[2] && (<img src={listArr[2]} />)}
              </div>
            </div>
          </div>
        )}

        {/* 4 pic */}
        {listArr.length > 3 && listArr.length < 9 && listArr.map((item, itemIndex) => {
          return <div className="avatar-mult-comp-4"
            style={{
              marginRight: [0, 2].includes(itemIndex) ? '2px' : '0px',
              marginTop: [2, 3].includes(itemIndex) ? '2px' : '0px',
              backgroundImage: 'url('+ morePagePersonIcon +')'}}
            >
            {item && (<img src={item} />)}
          </div>
        })}

        {/* 9pic */}
        {listArr.length >= 9 && listArr.map((item, itemIndex) => {
          return <div className="avatar-mult-comp-9"
            style={{
              marginTop: [3, 4, 5, 6, 7, 8].includes(itemIndex) ? '1px' : '0px',
              marginRight: [0, 1, 3, 4, 6, 7].includes(itemIndex) ? '1px' : '0px',
              backgroundImage: 'url('+ morePagePersonIcon +')'}}
            >
            {item && (<img src={item} />)}
          </div>
        })}

      </div>
    </Styled>
  )
}
