import { Request, Response, NextFunction } from 'express';
import  proxy from "express-http-proxy"
import { http2mq } from './suno';


const endResDecorator= (  proxyRes:any, proxyResData:any, req:any , userRes:any )=>{
   // slog('log','responseData'   );
    //mlog("log 数据 ",  proxyResData.toString('utf8')  ) 
    const dd={ from:'kling',etime: Date.now() ,url: req.originalUrl,header:req.headers, body:req.body ,data:proxyResData.toString('utf8') };
    
    http2mq( 'kling',dd )
    return proxyResData; //.toString('utf8') 
}



//klingAPI代理
export const klingProxy= proxy(  process.env.KLING_SERVER??'https://kling.kuaishou.com', {
		https: false, limit: '10mb',
		proxyReqPathResolver: function (req) {	
            
            return  req.originalUrl.replace('/pro', '')
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {     
			if ( process.env.KLING_KEY ) proxyReqOpts.headers['Authorization'] ='Bearer '+process.env.KLING_KEY;
			return proxyReqOpts;
		},
		userResDecorator:endResDecorator
})
