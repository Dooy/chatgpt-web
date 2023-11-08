import { generateRandomCode, mlog } from "./utils";
import { Request, Response, NextFunction } from 'express';
import { isNotEmptyString, isString } from "src/utils/is";
import { fetch } from './fetch'
import { publishData } from "./rabittmq";
import { botton2text, debug } from "./debug";
import { dataWrite, normalFormater, streamFormater} from './gptformart'
 
export interface msgType{
    text:string 
    attr?:any
    isStream?:boolean
    status?:number 
    model?:string
    other?:any //附带信息
    id?:string
}
const getLastMsg= ( body:any )=>{
    //messages[1].content
    const msg = body.messages;
    return msg[msg.length-1].content ;
}

//提交
const fetchMj = async (url:string, body?:any)=>{
    const userPsw=  isNotEmptyString( process.env.MJ_SERVER_USERPSW)? process.env.MJ_SERVER_USERPSW: "aitutu:20221116";
    const server_url= isNotEmptyString( process.env.MJ_SERVER_URL)? process.env.MJ_SERVER_URL: 'http://43.154.119.189:6090';

    const urls =server_url+url; 
    const authString = Buffer.from( userPsw ).toString('base64'); 
    let  opt: RequestInit={
        method: body?'POST':'GET',
        headers:{
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
        }
        //,body:body? JSON.stringify( body):null
    }
    if( body) opt.body=JSON.stringify( body);
    return fetch(urls  , opt);
    //
}

//内容解析
const body2Pasty=   ( body:string,reqbody:any ) =>{
    let data= {
        "base64Array": [],
        "instanceId": "",
        "modes": [],
        "notifyHook": "",
        "prompt": body,
        "remix": true,
        "state": ""
    }
    //return { }
    return {url:'/mj/submit/imagine',data, body}

}



const fetchMjPost= (url:string,data?:any)=>{
   
    return new Promise<any>((resolve, reject) => {
        fetchMj(  url, data).then( req=>req.json().then(d=>{
            if(d.error) reject(d);
            else resolve(d );
        }).catch(e=>reject(e))).catch(e=>reject(e));
    })
}
//这个是任务查询
const taskFetch= (rid:string)=>{
     const stime = Date.now();
     const getText=(d:any)=>{
        let rz = "\n!["+rid+"]("+d.imageUrl+")\n"
        if( d.bottons) rz+= botton2text( d.bottons);
        return rz;
     }
    return new Promise<any>((resolve, reject) => {
        const fun= ()=>{
            fetchMjPost('/mj/task/'+rid+'/fetch').then(d=>{
                mlog(`fetch[${rid}]`, d.progress );
                if(d.status=='SUCCESS'){
                    resolve({data:d, text:getText(d),taskID:rid});
                    return ;
                }
                if(  Date.now()-stime>10000*60*8 ) {
                    reject(`task:${rid} 超时`)
                    return  ;
                }
                 setTimeout(fun, 2000);
            }).catch(e=>reject(e));
        }
        fun();
        
    })
    
}

const submitImagine=  (obj:{url:string,data:any })=>{
     mlog('usubmitImagine',obj.url )
    return new Promise<string>((resolve, reject) => { 
         fetchMjPost(obj.url,obj.data ).then(d=>{
            if(!d.result){
                reject(d);
                return 
            }
            taskFetch( d.result).then(d=>resolve(d)).then(e=>reject(e));
         }).catch(e=>reject(e)) 
    })
       
}

const streamClient = (response:Response, msg:msgType )=>{
      const headers = {
			'Content-Type': 'text/event-stream',
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache'
		};
    const id= 'mj-'+ generateRandomCode(16);
    response.writeHead(200, headers);  
    dataWrite(response, streamFormater(id ,msg.text ,{attr:msg.attr,model:msg.model??'midjourney'} ) );
    dataWrite(response, streamFormater(id ,'' ,{attr:msg.attr,model:msg.model??'midjourney',finish:true} )  );
    dataWrite(response,  "[DONE]"  );
    response.end();
}
export const webClient = (response:Response, msg:msgType )=>{
    const headers = {
			'Content-Type': 'application/json',
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache'
	};
    response.writeHead(msg.status?? 200, headers); 
    response.write( JSON.stringify( normalFormater(msg.id??'mj-'+ generateRandomCode(16) ,msg.text ,{attr:msg.attr,model: msg.model?? 'midjourney'} )) );
    response.end();
}
export const toClient= (response:Response, msg: msgType)=>{
    if(msg.isStream ) streamClient( response,msg );
    else webClient(response,msg )
}
//主程序
export const mj2gpt=  async  ( request:Request, response:Response, next?:NextFunction)=>{
   const headers = {
			'Content-Type': 'application/json',
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache'
	};
    let isGo=false;
		const clientId = generateRandomCode(16);// generateRandomCode(16);
		const newClient = {
			id: clientId,response
	};
    request.on('close', () => console.log(`${clientId} Connection closed`) );
     let msg:msgType ={text:'',attr:null};

    try { 
        const body=  getLastMsg(  request.body ) as string;
        const isStream = request.body.stream;
        msg.isStream = isStream?true:false;
        mlog('请求>>',  msg.isStream , body  ); 
        if( body.indexOf('“闲聊”')>0 && body.indexOf('没有主题')){
            msg.text='画图:'+generateRandomCode(3);
            toClient(response,msg );
            return ;
        }
         
             
             
        // 测试
        // debug(response, body);
        // return ;
         
        //mlog('请求>>',isStream ,body  ); 
        const obj = body2Pasty(body,  request.body );
        if('/mj/submit/imagine'==obj.url ){
            const res:any =  await submitImagine(obj );
            msg.text=res.text;
            if( res.taskID ) msg.attr= {taskID:res.taskID };
        }else{
            msg.text= "什么事情都没干！";
        }
        
        toClient(response, msg );
         
    } catch (e) {
        response.writeHead(428, headers);
        let ss = e.reason??(  JSON.stringify(e ) );
        let error = { "error": {  "message":ss,  "type": "openai_hk_error", "code": "gate_way_error" }}
        response.end( JSON.stringify(error)  );
        mlog('error>>', ss ,e )
        publishData( "openapi", 'error_mjapi',  JSON.stringify({e: {status:428,reason:e} }));
        return ;
    }

    
}