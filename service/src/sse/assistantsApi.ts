import { Request, Response, NextFunction } from 'express';
import { generateRandomCode,mlog } from './utils';
import {getMyKey } from "./sse"
import { publishData } from './rabittmq';
import { isNotEmptyString } from 'src/utils/is';
import { fetchSSE } from './fetch-sse';
import { encode } from './tokens';


const changBody = ( body:any ,uid:number )=>{
    //mlog('changBody', body);
    let rz = body;
    const notifyHook=`${process.env.SSE_HTTP_SERVER}/openai/mjapi/${uid}` 
    rz.notifyHook= notifyHook +'/'+ ( rz.notifyHook?encodeURIComponent( rz.notifyHook ):'');
    if(!rz.state || rz.state=='')rz.state= `${uid}` ;
    mlog('changBody>> ',   rz.notifyHook );
    return rz ;
}

function getXRui( uri:string ){ 
     uri= uri.toLowerCase();
     let iend = uri.search(/[?&#]/);
     if(iend==-1) return uri;
    
    return uri.substring(0,iend);
}

//主程序
export const  assistantsApi = async  ( request:Request, response:Response, next?:NextFunction)=> {
    mlog('mytest');
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

	let tomq={header: request.headers,request:request.body,response:'',reqid: clientId ,status:200,myKey:'',myUrl:'', stime:Date.now(),etime:0,user:{} }

    const url= isNotEmptyString( process.env.OPENAI_API_BASE_URL)? process.env.OPENAI_API_BASE_URL: 'https://api.openai.com';
    const userPsw=  isNotEmptyString( process.env.OPENAI_API_KEY)? process.env.OPENAI_API_KEY: "sk-abc";

	const uri= request.headers['x-uri']?? request.url ;
    try{
            
            const mykey=await getMyKey(  request.headers['authorization'], request.body);
            //tomq.myKey=mykey.key ;
            tomq.myKey= userPsw ;
            tomq.myUrl = url ;
            tomq.user= mykey.user;

            const rqUrl=  url+uri ;//mykey.apiUrl==''? url+uri: mykey.apiUrl+uri;
           // const authString = ;//Buffer.from( userPsw ).toString('base64');

            mlog('请求>>', rqUrl,  mykey.user?.uid, mykey.user?.fen ,userPsw   );
            const body= request.method=='GET'?undefined: JSON.stringify (request.body) ;//JSON.stringify(  changBody(request.body,+mykey.user?.uid ));
            mlog( 'body' ,body ,request.method )

		    await fetchSSE( rqUrl ,{
                method: request.method, //'POST'
                headers:{
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v1',
                'Authorization': `Bearer ${userPsw}`
                 
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
                publishData( "openapi", 'error_assi',  JSON.stringify({e,tomq} ));
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
                publishData( "openapi", 'error_assi',  JSON.stringify({e,tomq} ));
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
				
				//请图片数据省得太大
				if(tomq.request.base64Array  ) tomq.request.base64Array=[];
				if(tomq.request.base64  ) tomq.request.base64='3';

                publishData( "openapi", 'error_assi',  JSON.stringify({e: {status:428,reason:e}, tomq }));
                return ;
			}
		}
		console.log("finish_assi",   request.headers['authorization'] )
        tomq.etime=Date.now();
		//请图片数据省得太大
		if(tomq.request.base64Array  ) tomq.request.base64Array=[];
		if(tomq.request.base64  ) tomq.request.base64='3';
        
        publishData( "openapi", 'finish_assi',  JSON.stringify(tomq));
		response.end();
}

//token计算

interface outType{
    error:number
    error_des:string
    data?:any
}
export const  tokenApi = async  ( request:Request, response:Response, next?:NextFunction)=> {
    let out:outType={  error:0,  error_des:''}
    const req = request.body
    if( !req.text ){
        out.error=401;
        out.error_des = '参数缺失 text';
        response.json( out) ;
        return ;
    }
    if( req.encode ){
        let code = encode(req.text)  ;
        let cc =[];
        code.forEach(v=> cc.push(v))
        out.data  = { cnt:code.length ,code: cc };
    }else{
        out.data  = {cnt:encode(req.text).length  }
    }
    response.json( out);
}