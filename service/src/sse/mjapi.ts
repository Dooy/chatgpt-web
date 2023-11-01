import { Request, Response, NextFunction } from 'express';
import { generateRandomCode, mError,mlog } from './utils';
import {getMyKey } from "./sse"
import { publishData } from './rabittmq';
import { isNotEmptyString } from 'src/utils/is';
import { fetchSSE } from './fetch-sse';


const changBody = ( body:any ,uid:number )=>{
    //mlog('changBody', body);
    let rz = body;
    const notifyHook=`${process.env.SSE_HTTP_SERVER}/openai/mjapi/${uid}` 
    rz.notifyHook= notifyHook +'/'+ ( rz.notifyHook?encodeURIComponent( rz.notifyHook ):'');
    if(!rz.state || rz.state=='')rz.state= `${uid}` ;
    mlog('changBody>> ',   rz.notifyHook );
    return rz ;
}

export const  mjapi = async  ( request:Request, response:Response, next?:NextFunction)=> {
    const headers = {
			'Content-Type': 'application/json',
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache'
		};
    let isGo=false;
		const clientId =  generateRandomCode(16);
		const newClient = {
			id: clientId,response
	};
    request.on('close', () => console.log(`${clientId} Connection closed`) );

	let tomq={header: request.headers,request:request.body,response:'',reqid: clientId ,status:200,myKey:'', stime:Date.now(),etime:0,user:{} }

    const url= isNotEmptyString( process.env.MJ_SERVER_URL)? process.env.MJ_SERVER_URL: 'http://43.154.119.189:6090';
    const userPsw=  isNotEmptyString( process.env.MJ_SERVER_USERPSW)? process.env.MJ_SERVER_USERPSW: "aitutu:20221116";

	const uri= request.headers['x-uri']??'/mj/submit/imagine'
    try{
            const mykey=await getMyKey( request.headers['authorization'], request.body);
            tomq.myKey=mykey.key ;
            tomq.user= mykey.user;

            const rqUrl=  url+uri ;//mykey.apiUrl==''? url+uri: mykey.apiUrl+uri;
            const authString = Buffer.from( userPsw ).toString('base64');

            mlog('请求>>', rqUrl,  mykey.user?.uid, mykey.user?.fen    );
            const body=  JSON.stringify(  changBody(request.body,+mykey.user?.uid ));
            //mlog( 'body' ,body )
		    await fetchSSE( rqUrl ,{
                method: 'POST',
                headers:{
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authString}`
		},
			onMessage(data) {
				if(!isGo) response.writeHead(200, headers);
				isGo=true; 
				response.write( data);
                tomq.response+= data;
			},
			onError(e) {
				console.log('onError>>', e );
				response.writeHead(e.status );
				response.end( e.reason);
                publishData( "openapi", 'error_mjapi',  JSON.stringify({e,tomq} ));
                //endStr=e.reason;
			},
			//body: JSON.stringify( request.body)
			body  
		});


    }catch(e){
			console.log('error>>',e)
			//response.send(2)
			if(e.status) {
				response.writeHead(e.status );
                publishData( "openapi", 'error_mjapi',  JSON.stringify({e,tomq} ));
                response.end( e.reason?.replace(/one_api_error/ig,'openai_hk_error'));
				return ;
				//response.write(`data: ${ e.reason}\n\n`);
			}
			else {
				response.writeHead(428);
				//response.end("get way error...\n"  );
                let ss = e.reason??'gate way error...';
				response.end( `{"error":{"message":"${ss}","type":"openai_hk_error","code":"gate_way_error"}}`   );
				console.log('error>>', ss ,e )
                publishData( "openapi", 'error_mjapi',  JSON.stringify({e: {status:428,reason:e}, tomq }));
                return ;
			}
		}
		console.log("finish_mjapi",  request.headers['authorization'])
        tomq.etime=Date.now();
        publishData( "openapi", 'finish_mjapi',  JSON.stringify(tomq));
		response.end();
}