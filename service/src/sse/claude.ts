import { Request, Response, NextFunction } from 'express';
import { generateRandomCode, mlog } from './utils';
import { isNotEmptyString } from 'src/utils/is';
import { getMyKey } from './sse';
import { publishData } from './rabittmq';
import { fetchSSE } from './fetch-sse';
export async function claudeProxy( request:Request, response:Response, next?:NextFunction) {
    try{
        sseDo(request,response,next )
    }catch(e ){
        mlog('error','top.cluadeProxy.error', e )
    }
}
async function sseDo( request:Request, response:Response, next?:NextFunction) {
    
    let headers = {
			//'Content-Type': 'text/event-stream',
			'Content-Type': 'application/json',
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache'
	};
    let isGo=false;
    const clientId =  generateRandomCode(16);
    const newClient = {
        id: clientId,response
    };
    request.on('close', () =>   mlog(`${clientId} Connection closed`) );

    let tomq={header: request.headers,request:request.body,response:'',reqid: clientId ,status:200,myKey:'', stime:Date.now(),etime:0,user:{} }
    let endStr = null;
    let  url= isNotEmptyString( process.env.CLAUDE_SERVER)? process.env.CLAUDE_SERVER: 'https://api.openai.com';

	let uri='/v1/messages'
    try{
        if( request.body && request.body.stream==true ){
            headers['Content-Type']= 'text/event-stream'; //为了 适配fastcgi
        }
        const mykey=await getMyKey( request,'claude' ); //request.headers['authorization'], request.body
        tomq.myKey=mykey.key ;
        tomq.user= mykey.user;
        let rqUrl=  url+uri
        let key= isNotEmptyString( process.env.CLAUDE_KEY)?process.env.CLAUDE_KEY:'sk-no-key'
        // --header "x-api-key: hk-your-key" \
        //--header "anthropic-version: 2023-06-01"
        await fetchSSE( rqUrl ,{
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                Authorization:  'Bearer '+key,
                'x-api-key':  key,
                'anthropic-version':  '2023-06-01',
            },
            onMessage(data) {
                if(!isGo) response.writeHead(200, headers);
                isGo=true;
                //console.log('onMessage>>', data )
                //response.write(`data: ${ data}\n\n`);
                response.write( data);
                tomq.response+= data;
                
            },
            onError(e) {
                console.log('onError>>', e );
                response.writeHead(e.status );
                response.end( e.reason);
                publishData( "openapi", 'error',  JSON.stringify({e,tomq} ));
                //endStr=e.reason;
            },
            body: JSON.stringify( request.body)
        });
    }catch(e){
            try{
                if(e.status) {
                   
                    console.log('error big3>>'    )
                    publishData( "openapi", 'error',  JSON.stringify({e,tomq} ));
                    response.writeHead(e.status );
                    response.end( e.reason?.replace(/one_api_error/ig,'openai_hk_error'));
                    return ;
                    //response.write(`data: ${ e.reason}\n\n`);
                }
                else {
                    publishData( "openapi", 'error',  JSON.stringify({e: {status:428,reason:e}, tomq }));
                    response.writeHead(428);
                    //response.end("get way error...\n"  );
                    let ss = e.reason??'gate way error...';
                    let ojson={"error":{"message": ss ,"type":"openai_hk_error","code":"gate_way_error"}}
                    response.end(  JSON.stringify(ojson)  );
                    if( e.reason ) mlog("error",'error big2>>', ss   )
                    else console.log('error no reason>>', e    )
                    
                    return ;
                }
            }catch(e3 ){
                mlog("error"," response.writeHead")
            }
    }
    try{
        mlog("log","finish",  request.headers['authorization'])
        tomq.etime=Date.now();
        publishData( "openapi", 'finish-claude',  JSON.stringify(tomq));
        response.end();
    }catch(e3 ){
        mlog("error","response.end")
    }

}
