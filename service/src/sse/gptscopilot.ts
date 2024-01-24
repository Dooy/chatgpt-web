import { fetchSSE,ChatGPTError2 } from "./fsse"
import { generateRandomCode, mlog } from './utils'
import { Request, Response, NextFunction } from 'express';
import { msgType, toClient, webClient } from "./mj2gpt";
 
//import {  fetchA, getApiKey, SessionRepository, updateSession} from "./db";
 
import { getResponseHeader } from "./chat2api"
import { writeAidutu } from "src/utils";
import { encode, numTokensFromMessages } from "./tokens";
import { normalFormater } from "./gptformart";
 


const GPTS_COOKIE = process.env.GPTS_COOKIE
//let reqCount = 0;

const fetchSSEQuery =  async  (request:Request, response:Response,messageBody:any,msg:msgType, reqCount:number )=>{
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
    if(messageBody.model=='gpt-4-all')messageBody.model='gpt-4-all' ;// process.env.GPTS_ALL? process.env.GPTS_ALL: "g-l23NycKzK";
    mlog('log','model', oldModel , messageBody.model, reqCount  );

    messageBody.stream= true; 

    const body = JSON.stringify( messageBody );
    const id= 'chatcmpl-'+ generateRandomCode(30); 
    msg.id= id ;
    let isGo= reqCount<=0 ? false :true ;
    let isDoing= false;  
    let isError=false;
    let isWriteHeader= false; 
    let isEnd=false;
    //let isFirst = reqCount<=0 ? false :true ;
    let oldData='';
    let arrDataString: string[]= [];
    try { 
       reqCount++;
       const res = await fetchSSE( url,{
            method: 'POST',
            headers: headers,
            onMessage: async (data:string)=> {
                 mlog('🐞测试'  ,  data ) 
                 if( isError ){
                    return ;
                 }
                 
                 if(!isGo) {
                    // let ddata=''
                    // try{
                    //     let pjson= JSON.parse(data );
                    //     ddata= pjson.choices[0].delta.content;
                    // }catch(e3){
                    // }
                    let ddata= getStreamContent(data);

                    //gptscopilot.ai/pricing
                    if(ddata.indexOf('chat.openai.com')>-1 ){
                         mlog('log','openai有错误', ddata )
                    }
                    else if( 
                    data.indexOf('We have run out of conversations today. Please try again tomorrow.')>-1
                    || ddata.indexOf('今日对话次数已用完，请明日再试')>-1
                    || ddata.indexOf('gptscopilot')>-1
                    || ddata.indexOf('.com')>-1
                    || ddata.indexOf('.ai')>-1
                    //|| ddata.indexOf('http')>-1
                    || data.indexOf('gptscopilot')>-1
                     ){
                        mlog('error', ddata )
                        writeAidutu( {data});
                        isError=true;
                        response.writeHead(428);
                        let obj={error:{"message":'请重试',  "type":"openai_hk_error","code":'please_retry'}}
                        //response.json( obj  );
                        response.end( JSON.stringify(obj)  );
                        isEnd= true;
                    }else if( ddata.indexOf('http')>-1  ){
                        mlog('error','警告', ddata )
                        response.writeHead(428);
                        let obj={error:{"message":'请重试',  "type":"openai_hk_error","code":'please_retry'}} 
                        response.end( JSON.stringify(obj)  );
                        isEnd= true;
                    }
                    //else if(msg.isStream ) response.writeHead(200, getResponseHeader( true) );
                 }
				 isGo=true;
                 if(!msg.isStream) {
                    // response.write(  data  ); 
                    // response.write(  "\n");
                    if(data=='[DONE]'){
                    }else if(oldData ){
                        //response.write( `data: ${oldData}\n` );  
                        //response.write(  "\n"); 
                        arrDataString.push( getStreamContent(data)); //每个chunk结果
                    }
                    
                 }
                 else if(data=='[DONE]'){
                    
                 }else{ 
                    //const chunkData=  getStreamContent(data);
                    arrDataString.push( getStreamContent(data)); //每个chunk结果
                    
                    if(oldData ){
                        const chunkData= arrDataString.join('');
                        if( chunkData.indexOf('gptscopilot')>-1
                            || chunkData.indexOf('openai-now')>-1
                        ){
                            response.write( `data: [DONE]\n\n` );//直接end发现异常
                            mlog('error','chunkData', chunkData )
                            writeAidutu( {data});
                            isEnd= true;
                            response.end();
                        }


                        if(   !isWriteHeader  ){
                            response.writeHead(200, getResponseHeader( true) );
                            isWriteHeader= true ;
                        }
                        if( !isEnd ){ 
                            response.write( `data: ${oldData}\n` );  
                            response.write(  "\n");
                        }
                         
                    }
                    
                    

                 }
                 if( data!='[DONE]' ) oldData= data;
               
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
       mlog('error','food',e);
       if( isEnd) return ;
        //response.send(2)
        try{
            if(e.status) {
                response.writeHead(e.status );
                if(e.status==403){
                    writeAidutu({'error':'可能是因为cookie 失效因为账号不存在' ,status:403 });
                }
                //publishData( "openapi", 'error',  JSON.stringify({e,tomq} ));
                //response.end( e.reason?.replace(/one_api_error/ig,'openai_hk_error'));
                //let ss = e.reason??'gate way error...';
                let obj={error:{"message":e.statusText,  "type":"openai_hk_error","code":e.status}}
                response.end(  JSON.stringify(obj)  );
                return ;
                
            }
            else if( e.statusCode ) {
                response.writeHead(428);
                if( e.statusCode==403 ){
                    writeAidutu({'error':'可能是因为cookie 失效因为账号不存在' ,status:403 });
                }
                //response.end("get way error...\n"  );
                let ss = e.reason??'gate way error...';
                response.end( `{"error":{"message":"${ss}","type":"openai_hk_error","code":"gate_way_error"}}`   );
                mlog('error', ss ,e )
                //publishData( "openapi", 'error',  JSON.stringify({e: {status:428,reason:e}, tomq }));
                return ;
            } 
        }catch(e2 ){
            mlog('error','food-gate-way-error');
            response.end( `{"error":{"message":"gate way error...","type":"openai_hk_error","code":"gate_way_error"}}`   );
            return ;
        }
    }
    const firstLen= arrDataString[0]? arrDataString[0].length :0 ;
    mlog('log','结果cnt=', arrDataString.length ,',reqCount=',reqCount,",strlen=" ,  firstLen );
    if( isEnd) return ;

    
    if(  arrDataString.length<=1 && firstLen==0  ){
         if( reqCount<=1 ){
            mlog('log','重复中 repost' );
            fetchSSEQuery(request, response,messageBody,msg , reqCount  ) //request:Request, response:Response,messageBody:any,msg
            return ;
         }else{
            mlog('log',' repost 无结果' );
            response.writeHead(428);
            let obj={error:{"message":'请重试',  "type":"openai_hk_error","code":'re_back_error'}}
            response.end( JSON.stringify(obj)  );
            return ;
         }
    }
     
    if( msg.isStream ) response.write( `data: [DONE]\n\n` );  
    
    //msg.isStream &&
    if( !msg.isStream ){
        //oldData
        let usage= {
            "prompt_tokens": numTokensFromMessages(request.body.messages ) ,
            "completion_tokens":  encode( arrDataString.join('')).length ,
            "total_tokens": 0
        } ;
        
        usage.total_tokens= usage.completion_tokens+usage.prompt_tokens ;
        // 
        const mjson = normalFormater(msg.id?? ('chatcmpl-'+ generateRandomCode(30)) , arrDataString.join('') ,{attr: {  usage },model: msg.model?? 'gpt-4-all'} );
        response.json( mjson );
    }
    response.end();

}

const getStreamContent =( data:string)=>{
    let ddata=''
    try{
        let pjson= JSON.parse(data );
        ddata= pjson.choices[0].delta.content as string;
        return ddata;
    }catch(e3){
        return '';
    }
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
        await fetchSSEQuery(request, response,  request.body,msg,0 );
         
         
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