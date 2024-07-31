import { Request, Response, NextFunction } from 'express';
import  proxy from "express-http-proxy"
import { http2mq } from './suno';
import { generateRandomCode, mlog } from './utils';
import axios, { AxiosError } from 'axios';
import FormData  from 'form-data'

const endResDecorator= (  proxyRes:any, proxyResData:any, req:any , userRes:any )=>{
   // slog('log','responseData'   );
    const dd={ from:'viggle',etime: Date.now() ,url: req.originalUrl,header:req.headers, body:req.body ,data:proxyResData.toString('utf8') };
    
    http2mq( 'viggle',dd )
    return proxyResData; //.toString('utf8') 
}

const endResDecoratorPro =(  proxyRes:any, proxyResData:any, req:any , userRes:any )=>{
   // slog('log','responseData'   );
    const dd={ 
        from:'pro-viggle',etime: Date.now() 
        ,url: req.originalUrl,header:req.headers
        , body:req.body ,data:proxyResData.toString('utf8')
        ,base_url:process.env.PRO_VIGGLE_SERVER
        ,base_key:process.env.PRO_VIGGLE_KEY
        ,mqcnt:0
     };
    
    http2mq( 'pro-viggle',dd )
    return proxyResData; //.toString('utf8') 
}



 
export async function viggleProxyFile  ( request:Request, response:Response, next?:NextFunction) {
    try{
       await  viggleProxyFileDo(request,response,next )
    }catch(e ){
        mlog('error','top.whisper.error', e )
    }

}
const viggleProxyFileDo=   async( req:Request, res:Response, next?:NextFunction)=>{
    // if ( process.env.VIGGLE_KEY ) proxyReqOpts.headers['Authorization'] ='Bearer '+process.env.VIGGLE_KEY;
    // else   proxyReqOpts.headers['Authorization'] ='Bearer '+process.env.OPENAI_API_KEY;  
    console.log('req.originalUrl', req.originalUrl );
    const clientId =  generateRandomCode(16);
    const dd={ from:'viggle-file',etime: Date.now() ,url: req.originalUrl,header:req.headers,clientId, body:"" ,data:{} };
    
    
    let BASE_URL =process.env.VIGGLE_SERVER
    let BASE_KEY =(process.env.VIGGLE_KEY??process.env.OPENAI_API_KEY)
    if(dd.url.indexOf('/pro')>-1 ){
        BASE_URL =process.env.PRO_VIGGLE_SERVER
        BASE_KEY =(process.env.PRO_VIGGLE_KEY??process.env.OPENAI_API_KEY)
    }

    if(req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const formData = new FormData();
      formData.append('file',  fileBuffer,  { filename:  req.file.originalname }  );
   
     try{
        let url = `${BASE_URL}${ req.originalUrl.replace('/pro', '') }` ;
        let responseBody = await axios.post( url , formData, {
                headers: {
                Authorization: 'Bearer '+ BASE_KEY ,
                'Content-Type': 'multipart/form-data',
                }
            })   ; 
            mlog("error",  responseBody.status )
        res.json(responseBody.data );
        try{
                dd.data= responseBody.data
                http2mq( 'viggle-file',dd )
        }catch(e){
                mlog("error", "viggle file error!")
        }
      }catch(e:any){ 
        //res.status( 400 ).json( {error: e } );
        //mlog("error", "viggle file error!" , e )
        try{
            mlog("error",  "viggle file error4!",e.response.status , e.response.data   )
            if(e.response.data && e.response.data.error && e.response.data.error.message 
                && e.response.data.error.message.indexOf('vg_up_image')>0  ){
                e.response.data.error.code='no_account_available' //"code": "get_channel_info_failed"
                e.response.data.error.message='no account available' //"code": "get_channel_info_failed"
            }
            res.status( e.response.status ).json(  e.response.data )
           
        }catch(e2){
          res.status( 400 ).json( {error: "viggle file error!" } );
        }
      }

    }else{
      res.status(400).json({'error':'uploader fail'});
    }
    
}

//lumaAPI代理
export const viggleProxy= proxy(  process.env.VIGGLE_SERVER??'https://suno-api.suno.ai', {
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
			if ( process.env.VIGGLE_KEY ) proxyReqOpts.headers['Authorization'] ='Bearer '+process.env.VIGGLE_KEY;
            //else proxyReqOpts.headers['Authorization'] ='Bearer hi' ;
			//proxyReqOpts.headers['Content-Type'] = 'application/json';
			return proxyReqOpts;
		},
		userResDecorator:endResDecorator
})


//lumaAPI代理
export const proViggleProxy= proxy(process.env.PRO_VIGGLE_SERVER??'https://suno-api.suno.ai', {
		https: false, limit: '10mb',
		proxyReqPathResolver: function (req) {
			//return req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
			// let url= req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
            // url=(process.env.SUNO_SERVER_DIR??'')+url;
            // return url;
            //console.log('proViggleProxy ', req.originalUrl )
            return  req.originalUrl.replace('/pro', '')
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) { 
			if ( process.env.VIGGLE_KEY ) proxyReqOpts.headers['Authorization'] ='Bearer '+process.env.PRO_VIGGLE_KEY;
			return proxyReqOpts;
		},
		userResDecorator:endResDecoratorPro
})