import { Request, Response, NextFunction } from 'express';
import  proxy from "express-http-proxy"
import { http2mq } from './suno';
import { mlog } from './utils';

const endResDecorator= (  proxyRes:any, proxyResData:any, req:any , userRes:any )=>{
   // slog('log','responseData'   );
    const dd={ from:'viggle',etime: Date.now() ,url: req.originalUrl,header:req.headers, body:req.body ,data:proxyResData.toString('utf8') };
    
    http2mq( 'viggle',dd )
    return proxyResData; //.toString('utf8') 
}


 
export async function viggleProxyFile  ( request:Request, response:Response, next?:NextFunction) {
    try{
       await  viggleProxyFileDo(request,response,next )
    }catch(e ){
        mlog('error','top.whisper.error', e )
    }

}
const viggleProxyFileDo= async( request:Request, response:Response, next?:NextFunction)=>{
    
}

//lumaAPI代理
export const viggleProxy= proxy(process.env.VIGGLE_SERVER??'https://suno-api.suno.ai', {
		https: false, limit: '10mb',
		proxyReqPathResolver: function (req) {
			//return req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
			// let url= req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
            // url=(process.env.SUNO_SERVER_DIR??'')+url;
            // return url;
            return  req.originalUrl
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) { 
			if ( process.env.VIGGLE_KEY ) proxyReqOpts.headers['Authorization'] ='Bearer '+process.env.VIGGLE_KEY;
            //else proxyReqOpts.headers['Authorization'] ='Bearer hi' ;
			//proxyReqOpts.headers['Content-Type'] = 'application/json';
			return proxyReqOpts;
		},
		userResDecorator:endResDecorator
})