import React from 'react';
import $ from 'jquery';
import { useRef, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Draggable from 'react-draggable';
import {DraggableCore} from 'react-draggable';
import proj4 from 'proj4';
import axios from 'axios';
import BusInfo from '../components/BusInfo'
import { TabContent } from 'react-bootstrap';
import { isCompositeComponent } from 'react-dom/test-utils';

const baseurl = 'http://localhost:9000/'

const BusStopDetailInfo = (props)=>{
    const [startXY, setStartXY] = useState();
    const [top, setTop] = useState();
    const [bottom, setBottom] = useState(13);

    const [bustop, setBustop] = useState();
    const [rbus, setRBus] = useState();
    const [dist, setDist] = useState();
    const [busnumlist, setBusNumList] = useState([]);

    const [testBus, setTestBus] = useState([{}]);

    const [isset, SetIsSet] = useState(false);

    const [y, setY] = useState();

    const navigate = useNavigate();

    var bustopinfobar, rbuslist; 

    const searchBusNum = (obj) => {
        setBusNumList([]);
        setTestBus([{}]);
        const busnum = axios.create({
            baseURL: baseurl
        })
        busnum.get('/api/bus/busstopbyroute',  {params: {busRouteId: obj.busRouteId}})
        .then(function(res){

            setBusNumList(busnumlist => [...busnumlist, res.data[0]]);
            setTestBus(testBus => [...testBus, {bus: obj, busnum: res.data[0]}]);
        }).catch(function(err){
            console.log("버스 routid로 정보 못받아옴");
        })
    };

    const searchbusstopinfo = (bstopid) => {

        const busstopinfo = axios.create({
            baseURL: baseurl
        })
        busstopinfo.get('/api/bus/arrinfo',  {params: {arsId: bstopid}})
        .then(function(res){

            setRBus(res.data);
            var busarr = res.data;
            if(busarr){
                SetIsSet(true);
                busarr.map((obj)=>{
                    searchBusNum(obj);
                })
            }
        }).catch(function(err){
            console.log("버스정류장 버스 도착 정보 못받아옴");
        })
    };
    
    const ref = useRef(null);

    const handleRefreshButton = () => {

        var bstopid = props.obj.arsId;
        searchbusstopinfo(bstopid);
    }


    



    useEffect(()=>{     //루트아이디로 버스 넘버 검색하는 거

    }, [])

    useEffect(()=>{
        setBustop(props.obj);

        handleRefreshButton();
        
        setTimeout((bustopinfobar = document.getElementById('bustopinfobar')), 100);

        var height = -(bustopinfobar.offsetHeight);
        setTop(height);
    }, [])

    function touchstart(){
        console.log("터치");
    }

    function touchmove(){
        console.log("터치중");
    }

    function touchend(){
        console.log("터치끝");
    }

    ////////////// 현재 내 위치와 선택한 건물의 거리 계산 (버정 BESSELTM 좌표계라 변환하는거까지)
    useEffect(()=>{
        const besseltm = "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43"
        const wgs84 = "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees" 
        var lat1x = props.obj.posX;
        var lon1y = props.obj.posY;
        var pt = new proj4.Point(lat1x, lon1y);
        var test = proj4(besseltm, wgs84, pt);
        var lat1 = test.y;
        var lon1 = test.x;

        var lat2x = props.location.latitude;
        var lon2y = props.location.longitude;


        function deg2rad(deg){
            return deg * (Math.PI/180);
        }

        var r = 6371;
        var dLat = deg2rad(lat2x-lat1);
        var dLon = deg2rad(lon2y-lon1);
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2x)) * Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = r* c;
        

        if(d < 1){
            setDist(Math.round(d*1000)+"m");
        }else{
            setDist(parseInt(d)+"km");
        }
        
    
    }, [])
    //////////////

    const handleStartButton = () => {

        navigate('/find-way', {
            state:{
                startBuilding: {obj: props.obj, address: "버스정류장", name: props.obj.bstopnm},
                mylocation: props.location,
                address: '버스정류장',
                id: 'start',
            }
        })
    }   
    const handleEndButton = () => {

        navigate('/find-way', {
            state:{
                endBuilding: {obj: props.obj, address: "버스정류장", name: props.obj.bstopnm},
                mylocation: props.location,
                address: '버스정류장',
                id: 'end',
            }
        })
    }

    const test1 = (evt, data) => {  //드래그 시작
        setStartXY(data);

    }
    const test2 = (evt, position) => {  //드래그 중
        const {x, y} = position;
        setY({x:0, y: y});


    }


    const test3 = (evt, data) => {  //드래그 끝
        var element = document.getElementById('bustopinfobar');
        var element1 = document.getElementById('bustopinfo');
        var bstoph = element1.offsetHeight;

        var posy;
        posy = startXY.y - data.y ;
        if(posy > 0){               //위로 드래그
            var height = (element.offsetHeight)*0.87 + data.y;
            $('#bustopinfo').stop(true).animate({bottom: height}, 300);
            $('#rbuslist').stop(true).animate({bottom: element.offsetHeight-bstoph}, 300);
            setTop(data.y);
            setBottom(height);       
        }
        else if(posy < 0){          //아래로 드래그
            var height = (element.offsetHeight)*0.87 - data.y;
            var heightup = (element.offsetHeight)*0.87 + data.y;

            $('#bustopinfo').stop(true).animate({bottom: data.y}, 300);
            $('#rbuslist').stop(true).animate({bottom: -element.offsetHeight+bstoph}, 300);
            setTop(data.y-(element.offsetHeight)*0.87);
            setBottom(data.y);

        }
    }

 
    return(
        <div id="bustopinfobar" style={{position: "fixed", width: "100%", height: "100%", bottom: "-87%", textAlign: "-webkit-center", zIndex: "0",}}> 
                {bustop &&          //봋
                    <div id="bustopinfo" style={{position: "relative", height: "100%",}}>
                        <Draggable bounds={{top: top, bottom: bottom}} positionOffset={0} position={y} axis='y' disabled={false} onStart={(e, data)=>{test1(e, data);}} onDrag={(e, position)=>{test2(e, position);}} onStop={(e, data)=>{test3(e, data);}} >
                        <div style={{position: "relative", width: "100%", height: "13%", textAlign: "-webkit-center", zIndex: "9",
                                    backgroundColor: "white", borderRadius: "15px 15px 0px 0px", boxShadow: "0px 2px 20px 2px #A6A6A6"}}>      
                            <div style={{position: "relative", width: "30%", height: "4%", top: "5px", backgroundColor: "#D5D5D5", borderRadius: "6px",}}>

                            </div>
                            <div style={{position: "relative", width:"100%", height: "100%"}}>
                                <div style={{fontSize: "1.2rem", float: "left", padding: "9px"}}>
                                    {bustop.stNm} <br></br>
                                    <div style={{fontSize: "1.0rem", float: "left", paddingLeft: "2px"}}>{dist}</div>
                                </div>
                                <div className="" style={{position: "absolute", width: "170px", float: "right", right: "0px", bottom: "15px"}}>
                                    <button id="button1" onTouchEnd={handleStartButton} type="button" class="btn btn-outline-primary btn-sm col-5" style={{borderRadius: "20px", height: "35px", marginLeft: "8px"}}>출발</button>
                                    <button id="button2" onTouchEnd={handleEndButton} type="button" class="btn btn-primary btn-sm col-5" style={{borderRadius: "20px", height: "35px", marginLeft: "8px"}}>도착</button>
                                </div>
                            </div>
                        </div>
                        </Draggable>
                        <Draggable positionOffset={0} position={y} axis='y' disabled={true}>
                        <div id="rbuslist" onTouchStart={touchstart} onTouchMove={touchmove} onTouchEnd={touchend} style={{position: "relative", overflowY: "scroll", width: "100%", height: "87%", bottom: "0px", zIndex: "10",
                                                    backgroundColor: "white"}}>
                            <ol className="list-group" >
                            {rbus && isset && rbus.map((obj, index)=>{
                                var test = busnumlist[index];

                                if(test){
                                    let time = obj.arrmsg1;
                                    var lowTP;
                                    if(obj.busType1 == 1){
                                        lowTP = '저상';
                                    }else{
                                        lowTP = null;
                                    }
                                return(
                                    <div>
                                    <BusInfo obj={test} time={time} lowTP={lowTP}></BusInfo>
                                    {/* <div style={{float: "left", textAlign: "-webkit-left" ,width: "100%", paddingLeft: "5%", color: "red"}}>
                                        남은 시간: {time}분   <text style={{color: "blue"}}>{lowTP}</text>
                                    </div> */}
                                    </div>
                                );}})}
                            </ol>
                            <div className="reload-bus"> {/*새로고침 버튼*/}
                                <button type="button" id="reloadbutton" className="" onClick={handleRefreshButton}><i class="bi bi-arrow-repeat" style={{ fontSize: "30px",}}></i></button>
                            </div>
                        </div> 
                        </Draggable>
                    </div>
                }
        </div>
    );
}

export default BusStopDetailInfo;
