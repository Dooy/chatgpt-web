import { Request, Response, NextFunction } from 'express';
import  proxy from "express-http-proxy"
import { http2mq } from './suno';
import { generateRandomCode, mlog } from './utils';
import axios, { AxiosError } from 'axios';
import FormData  from 'form-data'


const endResDecorator= (  proxyRes:any, proxyResData:any, req:any , userRes:any )=>{
   // slog('log','responseData'   );
    //mlog("log 数据 ",  proxyResData.toString('utf8')  ) 
    const dd={ from:'ideo',etime: Date.now() ,url: req.originalUrl,header:req.headers, body:req.body ,data:proxyResData.toString('utf8') };
    
    http2mq( 'ideo',dd )
    return proxyResData; //.toString('utf8') 
}



//ideoAPI代理
export const ideoProxy= proxy(  process.env.IDEO_SERVER??'https://api.ideogram.ai', {
		https: false, limit: '10mb',
		proxyReqPathResolver: function (req) {	
            
            return  req.originalUrl.replace('/pro', '')
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {     
			if ( process.env.IDEO_KEY ) proxyReqOpts.headers['Authorization'] ='Bearer '+process.env.IDEO_KEY;
			return proxyReqOpts;
		},
		userResDecorator:endResDecorator
})


export async function ideoProxyFile  ( request:Request, response:Response, next?:NextFunction) {
    try{
       await  ideoProxyFileDo(request,response,next )
    }catch(e ){
        mlog('error','top.whisper.error', e )
    }

}


const ideoProxyFileDo=   async( req:Request, res:Response, next?:NextFunction)=>{ 
    //console.log('req.originalUrl', req.originalUrl );
    const clientId =  generateRandomCode(16);
    const dd={ from:'ideo',etime: Date.now() ,url: req.originalUrl,header:req.headers,clientId, body:req.body ,data:{} };
    
    
    let BASE_URL =process.env.IDEO_SERVER
    let BASE_KEY =(process.env.IDEO_KEY??process.env.OPENAI_API_KEY)
   
    //mlog("log image_request",req.body.image_request )
    if(req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const formData = new FormData();
      formData.append('image_file',  fileBuffer,  { filename:  req.file.originalname }  );
      if ( req.body.image_request){
        formData.append("image_request", req.body.image_request)
      }

   
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
            http2mq( 'ideo',dd )
        }catch(e){
                mlog("error", "ideo2 file error!")
        }
      }catch(e:any){ 
        //res.status( 400 ).json( {error: e } );
        //mlog("error", "viggle file error!" , e )
        try{
            mlog("error",  "ideo file error4!",e.response.status , e.response.data   )
            
            res.status( e.response.status ).json(  e.response.data )
           
        }catch(e2){
          res.status( 400 ).json( {error: "ideo file error!" } );
        }
      }

    }else{
      res.status(400).json({'error':'uploader fail'});
    }
    
}