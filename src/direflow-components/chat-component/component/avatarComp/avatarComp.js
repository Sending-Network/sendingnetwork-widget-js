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
              <div
                className="avatar-mult-comp-3_bottom_item"
                style={{
                  backgroundImage: 'url('+ morePagePersonIcon +')',
                  marginLeft: '1px'
                }}
              >
                {listArr[2] && (<img src={listArr[2]} />)}
              </div>
            </div>
          </div>
        )}

        {/* 4 pic */}
        {listArr.length > 3 && listArr.length < 9 && (
          <div className="avatar-mult-comp-4">
            <div className="avatar-mult-comp-4_1">
              <div className="avatar-mult-comp-4_1_imgBox" style={{backgroundImage: 'url('+ morePagePersonIcon +')'}}>
                {listArr[0] && (<img src={listArr[0]} />)}
              </div>
              <div className="avatar-mult-comp-4_1_imgBox" style={{backgroundImage: 'url('+ morePagePersonIcon +')', marginLeft: '1px'}}>
                {listArr[1] && (<img src={listArr[1]} />)}
              </div>
            </div>
            <div className="avatar-mult-comp-4_1" style={{marginTop: '1px'}}>
              <div className="avatar-mult-comp-4_1_imgBox" style={{backgroundImage: 'url('+ morePagePersonIcon +')'}} >
                {listArr[2] && (<img src={listArr[2]} />)}
              </div>
              <div className="avatar-mult-comp-4_1_imgBox" style={{backgroundImage: 'url('+ morePagePersonIcon +')', marginLeft: '1px'}}>
                {listArr[3] && (<img src={listArr[3]} />)}
              </div>
            </div>
          </div>
        )}

        {/* 9pic */}
        {listArr.length >= 9 && (
          <div className="avatar-mult-comp-9">
            <div className="avatar-mult-comp-9_1">
              {listArr.map((img, imgIndex) => {
                if ([0, 1, 2].includes(imgIndex)) {
                  return <div
                    className="avatar-mult-comp-9_1_imgBox"
                    style={{
                      backgroundImage: 'url('+ morePagePersonIcon +')',
                      marginLeft: [1, 2].includes(imgIndex) ? '1px' : ''
                    }}>
                    {img && (<img src={img} />)}
                  </div>
                }
              })}              
            </div>
            <div className="avatar-mult-comp-9_1" style={{marginTop: '1px'}}>
              {listArr.map((img, imgIndex) => {
                if ([3, 4, 5].includes(imgIndex)) {
                  return <div
                    className="avatar-mult-comp-9_1_imgBox"
                    style={{
                      backgroundImage: 'url('+ morePagePersonIcon +')',
                      marginLeft: [4, 5].includes(imgIndex) ? '1px' : ''
                    }}>
                    {img && (<img src={img} />)}
                  </div>
                }
              })}
            </div>
            <div className="avatar-mult-comp-9_1" style={{marginTop: '1px'}}>
              {listArr.map((img, imgIndex) => {
                if ([6, 7, 8].includes(imgIndex)) {
                  return <div
                    className="avatar-mult-comp-9_1_imgBox"
                    style={{
                      backgroundImage: 'url('+ morePagePersonIcon +')',
                      marginLeft: [7, 8].includes(imgIndex) ? '1px' : ''
                    }}>
                    {img && (<img src={img} />)}
                  </div>
                }
              })}
            </div>
          </div>
        )}
      </div>
    </Styled>
  )
}
