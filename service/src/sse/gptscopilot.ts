import { fetchSSE,ChatGPTError2 } from "./fsse"
import { generateRandomCode, mlog } from './utils'
import { Request, Response, NextFunction } from 'express';
import { msgType, toClient, webClient } from "./mj2gpt";
 
//import {  fetchA, getApiKey, SessionRepository, updateSession} from "./db";
 
import { getResponseHeader } from "./chat2api"
import { writeAidutu } from "src/utils";
 


const GPTS_COOKIE = process.env.GPTS_COOKIE


const fetchSSEQuery =  async  (request:Request, response:Response,messageBody:any,msg:msgType )=>{
   
    mlog('baseurl', msg.isStream  );
    const url=`https://gptscopilot.ai/api/chat/completions` 
    const headers ={
            'Content-Type': 'application/json'
            ,'Cookie': GPTS_COOKIE
            ,'authority': 'gptscopilot.ai'
            ,'Accept': 'text/event-stream, text/event-stream'  
            ,'Origin': 'https://gptscopilot.ai' 
            ,'Referer': 'https://gptscopilot.ai'
            ,'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
    let  content  = '';
    let attr= []; //额外一次性的
    // mlog('log','model old ', messageBody.model );
    const oldModel= messageBody.model ;
    //gpt-4-gizmo-
    if( messageBody.model ) messageBody.model=  messageBody.model.replace(/gpt-4-gizmo-/ig,'');
    if(messageBody.model=='gpt-4-all')messageBody.model=  process.env.GPTS_ALL? process.env.GPTS_ALL: "g-ic1IxDDmk";
    mlog('log','model', oldModel , messageBody.model );

    const body = JSON.stringify( messageBody );
    const id= 'chatcmpl-'+ generateRandomCode(30); 
    msg.id= id ;
    let isGo=false;
    let isDoing= false;  
    let isError=false;
 
    let oldData='';
    try { 
       const res = await fetchSSE( url,{
            method: 'POST',
            headers: headers,
            onMessage: async (data:string)=> {
                 mlog('🐞测试'  ,  data ) 
                 if( isError ){
                    return ;
                 }
                 
                 if(!isGo) {
                    if(data.indexOf('We have run out of conversations today. Please try again tomorrow.')>-1 ){
                        writeAidutu( {data});
                        isError=true;
                        response.writeHead(428);
                        let obj={error:{"message":'请重试',  "type":"openai_hk_error","code":'please_retry'}}
                        //response.json( obj  );
                        response.end( JSON.stringify(obj)  );
                    }
                    else response.writeHead(200, getResponseHeader( true) );
                 }
				 isGo=true;
                 if(!msg.isStream) {
                    response.write(  data  ); 
                    response.write(  "\n"); 
                 }
                 else if(data=='[DONE]'){
                    response.write( `data: ${data}\n` );  
                    response.write(  "\n"); 
                 }else if(oldData ){
                    response.write( `data: ${oldData}\n` );  
                    response.write(  "\n"); 
                 }
                 oldData= data;
            },
            onError(e ){
                //console.log('eee>>', e )
                response.writeHead(e.status );
				response.end( e.reason);
                mlog('error','❌未错误',e    )
            },
            body 
        });
     } catch (e ) {
       mlog('error',e)
        //response.send(2)
        if(e.status) {
            response.writeHead(e.status );
            //publishData( "openapi", 'error',  JSON.stringify({e,tomq} ));
            //response.end( e.reason?.replace(/one_api_error/ig,'openai_hk_error'));
            //let ss = e.reason??'gate way error...';
            let obj={error:{"message":e.statusText,  "type":"openai_hk_error","code":e.status}}
            response.end(  JSON.stringify(obj)  );
            return ;
            
        }
        else {
            response.writeHead(428);
            //response.end("get way error...\n"  );
            let ss = e.reason??'gate way error...';
            response.end( `{"error":{"message":"${ss}","type":"openai_hk_error","code":"gate_way_error"}}`   );
            mlog('error', ss ,e )
            //publishData( "openapi", 'error',  JSON.stringify({e: {status:428,reason:e}, tomq }));
            return ;
        }
    } 
    
    response.end();

}



//主程序
export const gptscopilot=  async  ( request:Request, response:Response, next?:NextFunction)=>{
    const clientId = generateRandomCode(16);// generateRandomCode(16);
    const newClient = {
        id: clientId,response
	};
    request.on('close', () => console.log(`${clientId} Connection closed`) );
    let msg:msgType ={text:'',attr:null};

    try { 
        //const prompt =  getLastMsg(  request.body )  ;
        const isStream = request.body.stream;
        msg.isStream = isStream?true:false;
        msg.model=  request.body.model;
        await fetchSSEQuery(request, response,  request.body,msg );
         
         
    } catch (e) {
        response.writeHead(428, getResponseHeader(false));
        let ss = e.reason??(  JSON.stringify(e ) );

        let error = { "error": {  "message":ss,  "type": "openai_hk_error", "code": "gate_way_error" }}
        response.end( JSON.stringify(error)  );
        mlog('error', ss ,e )
        //mlog('错误啊'  ,e. )
        //publishData( "openapi", 'chat2api_error',  JSON.stringify({server:{host:OPENAI_API_BASE_URL, token:OPENAI_API_KEY  },e: {status:428,reason:e} }));
        return ;
    }

}