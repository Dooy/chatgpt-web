//import { fetchSSE } from "./fetch-sse"


import { fetchSSE,ChatGPTError2 } from "./fsse"
import { generateRandomCode, mlog } from './utils'
import { Request, Response, NextFunction } from 'express';
import { msgType, toClient, webClient } from "./mj2gpt";
import { publishData } from "./rabittmq";
import { dataWrite, streamFormater } from "./gptformart";
import { fetch } from "./fetch";
import { v4 as uuidv4 } from 'uuid';
import { encode, numTokensFromMessages } from "./tokens";
import {  getApiKey, SessionRepository, updateSession} from "./db";
 


const OPENAI_API_BASE_URL = process.env.C2API_BASE_URL
const OPENAI_API_KEY = process.env.OPENAI_API_KEY


// const url='https://beta.note123.net/backend-api/conversation'
// const sk='Aa112211'




const getData = (model: string, prompt:string[])=>{
    // 'gpt-4' //'text-davinci-002-render-sha'; //
    mlog('✅prompt',model , prompt  )
    if(model.toLocaleLowerCase().indexOf('gpt-4')>-1 ){
        model='gpt-4';
    }else{
        model='text-davinci-002-render-sha';
    }

    const datatt= {
            "action": "next",
            "messages": [
                {
                "id": uuidv4(),
                "author": {
                    "role": "user"
                },
                "content": {
                    "content_type": "text",
                    "parts": prompt
                },
                "metadata": {}
                }
            ],
            "parent_message_id":  uuidv4(),
            "model":  model,
            "plugin_ids": [],
            "timezone_offset_min": -480, 
            "history_and_training_disabled": false,
            "arkose_token": null,
            "force_paragen": false
            }
    return datatt;
}

const content2ImgMarkdown= async ( d:any[] )=>{
    let text='';
    //d.map((v,i)=>{
    for(let i in d ){
        let v=d[i];
        text +=`![img${i+1}](${ await downloadImg(v.asset_pointer) }) `
    }
        
    //});
    if(text!='') text ="\n"+ text  + "\n";
    return text;
}

export const getResponseHeader= (isStream:boolean)=>{
    if( isStream){
        return {
			'Content-Type': 'text/event-stream',
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache'
		};
    }
    return {
			'Content-Type': 'application/json',
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache'
	};
}
//https://beta.note123.net/backend-api/files/file-m5T415U5KdvoFgoCsyc3kQrL/download
const downloadImg=  async (file:string )=>{
    //const OPENAI_API_BASE_URL = process.env.C2API_BASE_URL
    //https://beta.note123.net/backend-api/files/file-m5T415U5KdvoFgoCsyc3kQrL/download
    //file-service://file-2b57qSEqeeTkp4ztNYp8Hjzc/
    const url = `${OPENAI_API_BASE_URL}/backend-api/files/${file.replace('file-service://','')}/download`
    const headers ={
            'Content-Type': 'application/json'
            ,'Authorization': 'Bearer '+OPENAI_API_KEY
           // ,'Accept': 'text/event-stream'
            ,'AUTHKEY': 'xyhelper'
            ,'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
    return new Promise<string>((resolve, reject) => {
        fetch( url,{headers} ).then(rep=> rep.json().then(d=>{
        
           if (d.download_url)  resolve(d.download_url);
           else reject('不存在图片');
        }).catch(e=>reject(e))
        ).catch(e=>reject(e));
    })
    
}

 

const fetchSSEQuery =  async  (request:Request, response:Response,prompt:string[],msg:msgType )=>{
   
    mlog('baseurl', OPENAI_API_BASE_URL, msg.isStream  );
    const url=`${OPENAI_API_BASE_URL}/backend-api/conversation`
    //const url=`http://api.zahei.com/v1/chat/completions`
    //await getApiKey();
    const onekey= await getApiKey() ;;
    const sk= 'api::'+onekey.id+'::'+onekey.email // OPENAI_API_KEY
    mlog('这边的COOKIE是多少？', onekey.cookie )
    const headers ={
            'Content-Type': 'application/json'
            ,'Authorization': 'Bearer '+sk
            ,'Cookie': (onekey.cookie)
            //,'AUTHKEY': 'xyhelper'
            //,'Accept': '*/*' //这个是一个考核项
            //,'Origin': 'https://chat.openai.com'
            //,'Cache-Control': 'no-cache'
            //,'Accept-Encoding': 'gzip, deflate, br'//这个是一个考核项
            //,'Connection': 'keep-alive' //这个是一个考核项
            //,'sec-fetch-mode': 'cors'
            //,'AUTHKEY': 'xyhelper'
            //,'Referer': 'https://chat.openai.com/c/fdcae85c-637d-48ba-adea-b5c7d42d4f9a'
            //,'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
    let  content  = '';
    let attr= []; //额外一次性的
   
    const body = JSON.stringify( getData(msg.model,prompt));
    const id= 'chatcmpl-'+ generateRandomCode(30); 
    msg.id= id ;
    let isGo=false;
    let isDoing= false; 
    const toData= (tdata:string,isEnd?:boolean)=>{
        //dataArr.push();
        if(msg.isStream) {
            !isGo &&  response.writeHead(200, getResponseHeader(true));  
            dataWrite(response, streamFormater(id , tdata ,{model:msg.model??'gpt-3.5-turbo'} ) );
            isGo=true;
        } 
         
    }
    const toProcess=  (tdata:string)=>{
        const dt = tdata.substring(content.length,tdata.length);
        content= tdata;
        toData(dt);

    }
    //mlog('body>>', body )
 
    
    const endFun = ()=>{
        if(isDoing) return ;
        let usage= {
            "prompt_tokens": numTokensFromMessages(request.body.messages ) ,
            "completion_tokens":  encode( content).length ,
            "total_tokens": 0
        } ;
        usage.total_tokens= usage.completion_tokens+usage.prompt_tokens ;
        mlog('log', `问:${ usage.prompt_tokens} 补: ${usage.completion_tokens}`);
        if(msg.isStream){
            //关闭的时候 再去完成！
            toData('',true )
            dataWrite(response, '[DONE]');
            response.end();
        }else{
            if( attr.length>0 ) content= [attr.join("\n"), content].join("\n")
            msg.text =  content;
            msg.attr= {usage };
            webClient(response, msg );
        }
    }
    try { 
       const res = await fetchSSE( url,{
            method: 'POST',
            headers: headers,
            onMessage: async (data:string)=> {
                // mlog('🐞测试'  ,  data ) 
                try {
                    if(data=='[DONE]') {
                        mlog('完成'  ,  data )  
                        return ;
                    } 
                    let d2 =data.indexOf("\n")>0?  data.split("\n").shift()  :  data;
                    let obj = JSON.parse(d2);
                    if( obj.message ) {
                        let type =  obj.message.content.content_type; //message.content.content_type
                        if( type== 'multimodal_text'){
                            isDoing=true;
                            mlog('🤮画图开始', obj.message.status );
                            const a=  await content2ImgMarkdown(  obj.message.content.parts)
                            mlog('log','🤮画图', obj.message.status , a ) 
                            attr.push(a);
                            toData( a);
                            isDoing=false;
                            endFun();
                        }
                        else if( type== 'text' &&  obj.message.author.role=='assistant' ) {
                            const a= obj.message.content.parts.join("\n");
                            mlog('✅>>', obj.message.status , a) 
                            toProcess( a);
                        }else{
                            mlog('❎ type>>',  type  ) 
                        }
                    }else{
                        mlog('❌不是message'  ) 
                    }
                } catch (error) {
                    mlog('❌3 error>>' ,data   )
                    
                }
                
            },
            onError(e ){
                //console.log('eee>>', e )
                mlog('❌未错误',e    )
            },
            body 
        });
     } catch (error ) {
        const a  =error as ChatGPTError2;
        try {
            if(a.statusCode==401 ){
                if(   a.reason && a.reason.toLocaleLowerCase().indexOf('not parse your authentication token')>-1 ){
                    onekey.cookie='';
                }else{
                    onekey.status=0; //这个时候 应该去更新下远程的库
                    
                }
                mlog('error','远程更新', a.reason )
                //SessionRepository().then( dbRep=>dbRep.save(onekey)).catch(eee=>{});
                updateSession(onekey);
                
            } 
        }catch(ee){
        }
        mlog('错误错误代码',error.reason  )
        throw(error );
    } 
    endFun();

}

const getLastMsg= ( body:any )=>{ 
    const arr = [];
    const msg:any[] = body.messages.slice(-16);  //array.slice(-10);
    msg.map(v=>{
        if(v.content && v.role!='system') arr.push(v.content);
    })
    return arr;
} 
//主程序
export const chat2api=  async  ( request:Request, response:Response, next?:NextFunction)=>{
    const headers = {
			'Content-Type': 'application/json',
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache'
	};

    
    const clientId = generateRandomCode(16);// generateRandomCode(16);
    const newClient = {
        id: clientId,response
	};
    request.on('close', () => console.log(`${clientId} Connection closed`) );
    let msg:msgType ={text:'',attr:null};
    try { 
        const prompt =  getLastMsg(  request.body )  ;
        const isStream = request.body.stream;
        msg.isStream = isStream?true:false;
        msg.model=  request.body.model;
        await fetchSSEQuery(request, response,[ prompt.join("\n\n")],msg );
         
         
    } catch (e) {
        response.writeHead(428, headers);
        let ss = e.reason??(  JSON.stringify(e ) );

        let error = { "error": {  "message":ss,  "type": "openai_hk_error", "code": "gate_way_error" }}
        response.end( JSON.stringify(error)  );
        mlog('error', ss ,e )
        //mlog('错误啊'  ,e. )
        //publishData( "openapi", 'chat2api_error',  JSON.stringify({server:{host:OPENAI_API_BASE_URL, token:OPENAI_API_KEY  },e: {status:428,reason:e} }));
        return ;
    }


}