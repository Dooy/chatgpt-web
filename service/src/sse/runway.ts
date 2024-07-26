

import { Request, Response, NextFunction } from 'express';
import  proxy from "express-http-proxy"
import { http2mq } from './suno';

const endResDecorator= (  proxyRes:any, proxyResData:any, req:any , userRes:any )=>{
   // slog('log','responseData'   );
    const dd={ from:'runway',etime: Date.now() ,url: req.originalUrl,header:req.headers, body:req.body ,data:proxyResData.toString('utf8') };
    
    http2mq( 'runway',dd )
    return proxyResData; //.toString('utf8') 
}

//lumaAPI代理
export const runwayProxy= proxy(  process.env.RUNWAY_SERVER??'https://suno-api.suno.ai', {
		https: false, limit: '10mb',
		proxyReqPathResolver: function (req) {
			//return req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
			// let url= req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
            // url=(process.env.SUNO_SERVER_DIR??'')+url;
            // return url;
            //console.log('viggleProxy ', req.originalUrl )
            return  req.originalUrl.replace('/pro', '')
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) { 
            //mlog("log ",srcReq.originalUrl  )
			if ( process.env.VIGGLE_KEY ) proxyReqOpts.headers['Authorization'] ='Bearer '+process.env.RUNWAY_KEY;
            //else proxyReqOpts.headers['Authorization'] ='Bearer hi' ;
			//proxyReqOpts.headers['Content-Type'] = 'application/json';
			return proxyReqOpts;
		},
		userResDecorator:endResDecorator
})