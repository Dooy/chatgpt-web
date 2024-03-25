import { Request, Response, NextFunction } from 'express';
import { generateRandomCode, mError,mlog } from './utils';
import {checkModelFotbitten, checkWhileIp, getMyKey } from "./sse"
import { publishData } from './rabittmq';
import { isNotEmptyString } from 'src/utils/is';
import { fetchSSE } from './fetch-sse';

export interface changType{
	uri:string
	mode:string
}	

const fast_uid = isNotEmptyString(process.env.FAST_UID)? process.env.FAST_UID.split(',').map(v=>v.trim() ) :[];

const changBody = ( body:any ,idArr:number[],cType:changType)=>{
    //mlog('changBody', body);  
    let rz = body;
	const uid= idArr[0];
	const uri= cType.uri
    const notifyHook=`${process.env.SSE_HTTP_SERVER}/openai/mjapi/${uid}-${idArr[1]}` 
    rz.notifyHook= notifyHook +'/'+ ( rz.notifyHook?encodeURIComponent( rz.notifyHook ):'');
	const isRelax= cType.mode=='slow' || cType.mode=='relax'
	if (isRelax && uri!='/mj/insight-face/swap'){
		 rz.notifyHook= notifyHook +`-relax/`+ ( rz.notifyHook?encodeURIComponent( rz.notifyHook ):'');
	}
    if(!rz.state || rz.state=='')rz.state= `${uid}` ;
	//mlog( 'Fast UID=',uid, fast_uid )
	const subArr=['/mj/submit/imagine','/mj/submit/blend','/mj/submit/describe','/mj/submit/action','/mj/submit/shorten' ];
	if(  subArr.indexOf(uri)>-1 ){
		
		if (fast_uid.indexOf( `${uid}`)>-1 ||  cType.mode=='fast'  ) { //
			mlog('log','快速 UID=',uid , cType.mode )
			if(rz.accountFilter) rz.accountFilter.modes=['FAST']
			else rz.accountFilter= {modes:['FAST'] }
		}
		else if(  isRelax  ){
			mlog('log','慢速 ',uid , cType.mode )
			if(rz.accountFilter) rz.accountFilter.modes=['RELAX'] //relax
			else rz.accountFilter= {modes:['RELAX'] }
		}else {
			
			mlog('log','一般模式 ',uid , cType.mode )
			if(rz.accountFilter) delete rz.accountFilter ;
		}

	}
	
	
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

	let  uri= (request.headers['x-uri']??'/mj/submit/imagine') as string
	let  xmode= (request.headers['x-mode']??'') as string
	if (uri.indexOf('/fast/')==0){
		xmode='fast'
		uri=uri.substring( 5)
	}
	if(uri.indexOf('/relax/')==0){
		xmode='relax'
		uri=uri.substring(6)
	}
    try{
            
            //const mykey=await getMyKey( request.headers['mj-api-secret']?? request.headers['authorization'], request.body);
            const mykey=await getMyKey(request,'mj' ); // request.headers['mj-api-secret']?? request.headers['authorization'], request.body
            tomq.user= mykey.user;
			//验证IP百名单
            //await checkWhileIp( +mykey.user.uid,request );

			//checkModelFotbitten('midjourney',mykey.attr );

            const rqUrl=  url+uri ;//mykey.apiUrl==''? url+uri: mykey.apiUrl+uri;
            const authString = Buffer.from( userPsw ).toString('base64');

            mlog('请求>>', rqUrl,  mykey.user?.uid, mykey.user?.fen ,authString   );

			let son_id=0;
			if ( mykey.user?.son  ){
				try{
					const ajson = JSON.parse( mykey.user.son);
					son_id= +ajson.id ;
				}catch(e ){
					mlog("error",' mj-son>>', e )
				}
			}

            const body=  JSON.stringify(  changBody(request.body,[ +mykey.user?.uid , son_id],{uri,mode:xmode} ));
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
				
				//请图片数据省得太大
				if(tomq.request.base64Array  ) tomq.request.base64Array=[];
				if(tomq.request.base64  ) tomq.request.base64='3';

                publishData( "openapi", 'error_mjapi',  JSON.stringify({e: {status:428,reason:e}, tomq }));
                return ;
			}
		}
		console.log("finish_mjapi",  request.headers['mj-api-secret']?? request.headers['authorization'] )
        tomq.etime=Date.now();
		//请图片数据省得太大
		if(tomq.request.base64Array  ) tomq.request.base64Array=[];
		if(tomq.request.base64  ) tomq.request.base64='3';

        publishData( "openapi", 'finish_mjapi',  JSON.stringify(tomq));
		response.end();
}
