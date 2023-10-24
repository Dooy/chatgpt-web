
import { time } from 'console';
import { Request, Response, NextFunction } from 'express';
import { isNotEmptyString } from 'src/utils/is';
import { fetchSSE } from './fetch-sse';
import { createRedis } from './redis';
import { publishData } from './rabittmq';
import fetch from 'node-fetch';
import { RedisClientType } from 'redis';
import { generateRandomCode, mError } from './utils';


async function getMyKey(authorization:string,body:any):Promise<any> {
    //if(authorization)
    const arr = authorization.split('-');

    if( !arr[1]) throw  new mError( "HK KEY ERROR, KEY格式错误！");
    const kk= `hk:${arr[1]}`;
    const redis= await createRedis();
    let mvar:any =  await redis.hGetAll(kk);
    if(!mvar || Object.keys(mvar).length==0 ||  !mvar.uid ||  +mvar.uid<=0  ){
        let res= await fetch(`${process.env.SSE_HTTP_SERVER}/openai/client/hk/${arr[1]}` )
        const rdate:any =await res.json()  
        console.log('服务端获取用户信息>>',rdate?.data?.hk, authorization );
        //await redis.HSET(kk, );
        const hk=rdate?.data?.hk
        if(hk){
            await Object.keys(hk).map(async k=>{ await redis.hSet(kk,k,hk[k]) });
            await redis.expire(kk,300); //5分钟 不然充值后 余额一直都不更新
        }
        mvar= hk;
    }
    const fen= +(mvar?.fen??0);
    if( !mvar.uid ||  +mvar.uid<=0 ) {
        console.log( authorization, 'HK key error , is no exit  ! HK key 不存在！', kk );
        throw  new mError('HK key error , is no exit  ! HK key 不存在！') ;
    }
    if( fen<=0) {
        console.log( authorization, 'Insufficient points, please recharge 积分不足，请充值' );
        throw  new mError('Insufficient points, please recharge 积分不足，请充值');
    }
    const poolkey= await getKeyFromPool(redis,+mvar.uid,body.model); //从卡池中获取key
    const parr = poolkey.split('||');


    //console.log('test redis>>',  mvar , body.model ,await getKeyFromPool(redis,+mvar.uid,body.model) );
    //await redis.set('abc','time:'+ Date.now() );
    redis.disconnect();
    return {key:'Bearer '+parr[0], user:mvar,apiUrl:parr[1]??'' };
}

//取 0到 max-1随机数
function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

async function getKeyFromPool(redis:RedisClientType, uid:number, model:string,oldkey?:string):Promise<string> {
    let key='pool:3k';
    if(model?.indexOf('gpt-4')>=0) key='pool:4k';
    const rz = await redis.get(key);
    //console.log('test redis>>',  rz );
    const kesy = JSON.parse(rz);
    if( kesy.length==0)  {
        if(oldkey) return oldkey;
        throw new mError('pools no key');
    }
    const ik= getRandomInt(kesy.length);
    //console.log('test redis>>',  kesy.length  );
    return kesy[ ik ];
    // if(oldkey && kesy.indexOf(oldkey)>=0){
    //      return oldkey;
    // }
    // return kesy[ uid %kesy.length];

}


//主要转发接口
export async function sse( request:Request, response:Response, next?:NextFunction) {
    
    const headers = {
			'Content-Type': 'text/event-stream',
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache'
		};
		
		
		let isGo=false;
		const clientId =  generateRandomCode(16);
		const newClient = {
			id: clientId,response
		};
		request.on('close', () => {
			console.log(`${clientId} Connection closed`);
			//clients = clients.filter(client => client.id !== clientId);
		});

		let tomq={header: request.headers,request:request.body,response:'',reqid: clientId ,status:200,myKey:'', stime:Date.now(),etime:0,user:{} }
        let endStr = null;
		//console.log( 'request.headers',  request.headers );
		//console.log( 'request.body',  request.body );
		const url= isNotEmptyString( process.env.SSE_API_BASE_URL)? process.env.SSE_API_BASE_URL: 'https://api.openai.com';

		const uri= request.headers['x-uri']??'/v1/chat/completions'
       
		try{
            const mykey=await getMyKey( request.headers['authorization'], request.body);
            tomq.myKey=mykey.key ;
            tomq.user= mykey.user;
            // console.log('请求>>', uri,  mykey.user?.uid, mykey.user?.fen,tomq.myKey , mykey.apiUrl );
            const rqUrl= mykey.apiUrl==''? url+uri: mykey.apiUrl+uri;
             console.log('请求>>', rqUrl,  mykey.user?.uid, mykey.user?.fen,tomq.myKey   );
		    await fetchSSE( rqUrl ,{
                method: 'POST',
                headers:{
                'Content-Type': 'application/json',
                Authorization:  tomq.myKey
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
			console.log('error>>',e)
			//response.send(2)
			if(e.status) {
				response.writeHead(e.status );
                publishData( "openapi", 'error',  JSON.stringify({e,tomq} ));
                response.end( e.reason?.replace(/one_api_error/ig,'openai_hk_error'));
				return ;
				//response.write(`data: ${ e.reason}\n\n`);
			}
			else {
				response.writeHead(428);
				//response.end("get way error...\n"  );
                let ss = e.reason??'gate way error...';
				response.end( `{"error":{"message":"${ss}","type":"openai_hk_error"}}`   );
				console.log('error>>', ss ,e )
                publishData( "openapi", 'error',  JSON.stringify({e: {status:428,reason:e}, tomq }));
                return ;
			}
		}
		console.log("finish",  request.headers['authorization'])
        tomq.etime=Date.now();
        publishData( "openapi", 'finish',  JSON.stringify(tomq));
		response.end();
}