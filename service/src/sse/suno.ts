import { Request, Response, NextFunction } from 'express';
import  proxy from "express-http-proxy"
import { generateRandomCode, mlog } from './utils';
import { checkWhileIp, getMyKey } from './sse';
import { publishData } from './rabittmq';

export const  sunoApi = async  ( request:Request, response:Response, next?:NextFunction)=> {
}
const endResDecorator= (  proxyRes:any, proxyResData:any, req:any , userRes:any )=>{
   // slog('log','responseData'   );
    const dd={ from:'cnt',etime: Date.now() ,url: req.originalUrl,header:req.headers, body:req.body 
    ,data:proxyResData.toString('utf8'), statusCode: proxyResData.statusCode };
    
    http2mq( 'suno',dd )
    return proxyResData; //.toString('utf8') 
  }
//sunoAPI代理
export const sunoProxy= proxy(process.env.SUNO_SERVER??'https://suno-api.suno.ai', {
		https: false, limit: '10mb',
		proxyReqPathResolver: function (req) {
			//return req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
			let url= req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
            url=(process.env.SUNO_SERVER_DIR??'')+url;
            return url;
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) { 
			if ( process.env.SUNO_KEY ) proxyReqOpts.headers['Authorization'] ='Bearer '+process.env.SUNO_KEY;
            else proxyReqOpts.headers['Authorization'] ='Bearer hi' ;
			proxyReqOpts.headers['Content-Type'] = 'application/json';
			return proxyReqOpts;
		},
		userResDecorator:endResDecorator
})

export const sunoNewApiProxy=proxy(process.env.SUNO_NEWAPI_SERVER??'https://suno-api.suno.ai', {
		https: false, limit: '10mb',
		proxyReqPathResolver: function (req) {
			//return req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
			let url= req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
            //url=(process.env.SUNO_SERVER_DIR??'')+url;
            return url;
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) { 
			if ( process.env.SUNO_NEWAPI_KEY ) proxyReqOpts.headers['Authorization'] ='Bearer '+process.env.SUNO_NEWAPI_KEY;
            else proxyReqOpts.headers['Authorization'] ='Bearer hi' ;
			proxyReqOpts.headers['Content-Type'] = 'application/json';
			return proxyReqOpts;
		},
		userResDecorator:(  proxyRes:any, proxyResData:any, req:any , userRes:any )=>{ 
            const dd={ from:'suno-newapi',etime: Date.now() ,url: req.originalUrl,header:req.headers, body:req.body 
            ,data:proxyResData.toString('utf8') , statusCode: proxyResData.statusCode };
            http2mq( 'suno-newapi',dd )
            return proxyResData;
        }
})

//sunoAPI代理
export const suno2Proxy= proxy(process.env.SUNO_SERVER??'https://suno-api.suno.ai', {
		https: false, limit: '10mb',
		// proxyReqPathResolver: function (req) {
		// 	//return req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
		// 	let url= req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
        //     url=(process.env.SUNO_SERVER_DIR??'')+url;
        //     return url;
		// },
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) { 
			if ( process.env.SUNO_KEY ) proxyReqOpts.headers['Authorization'] ='Bearer '+process.env.SUNO_KEY;
            else proxyReqOpts.headers['Authorization'] ='Bearer hi' ;
			proxyReqOpts.headers['Content-Type'] = 'application/json';
			return proxyReqOpts;
		},
		userResDecorator:endResDecorator
})
export const headerSet = async(req:Request, response:Response, next?:NextFunction)=>{
// 如果 Content-Type 不是 application/json，手动设置为 application/json
    console.log("asdsd>> ",req.headers['content-type'],"\n\n", req.body )
    if ( !req.headers['content-type']  ) {
        req.headers['content-type'] = 'application/json';
        // 如果请求体不是 JSON 格式，可以在这里进行转换
        // 例如，将表单数据转换为 JSON
        if (req.body && typeof req.body === 'object') {
            req.body = JSON.stringify(req.body);
        }
    }
    next();
}
//用户确认是否有积分
export const openHkUserCheck= async  ( request:Request, response:Response, next?:NextFunction)=> {
     const clientId =    generateRandomCode(16);
     let tomq={header: request.headers,request:request.body,response:'',reqid: clientId ,status:200,myKey:'', stime:Date.now(),etime:0,user:{} }

     try{
        let model= 'suno-v3'
        //if(request.url)
       
        if(  request.url && request.url.indexOf('mj/submit')>0 ){
            model='mj'
        }
        // mlog('model>> ', request.url ,model  )
        const mykey=await getMyKey(request,model ); //并发限制去除
        tomq.user= mykey.user;
       
        next();
     }catch(e){
        //console.log('error>>',e)
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
				response.end( `{"error":{"message":"${ss}","type":"openai_hk_error","code":"gate_way_error"}}`   );
				console.log('error>>', ss ,e )
				
				//请图片数据省得太大
				if(tomq.request.base64Array  ) tomq.request.base64Array=[];
				if(tomq.request.base64  ) tomq.request.base64='3';

                publishData( "openapi", 'error',  JSON.stringify({e: {status:428,reason:e}, tomq }));
                return ;
			}
     }

    
}

//通过url提交到 mq key
export const http2mq=(rountKey:string, data:any  )=>{
    const notifyHook=`${process.env.SSE_HTTP_SERVER}/openai/mq/${rountKey}` 
    let header = {'Content-Type':'application/json'};
   

    return new Promise<any>((resolve, reject) => {
        let opt:RequestInit ={method:'GET'}; 
        opt.headers=header;
        if(data) {
            opt.body= JSON.stringify(data) ;
             opt.method='POST';
        }
        fetch( notifyHook ,  opt )
        .then(d=>d.json().then(d=> resolve(d))
        .catch(e=>reject(e)))
        .catch(e=>reject(e))
    })
}

