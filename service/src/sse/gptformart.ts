import { isString } from "src/utils/is";
import { Response } from 'express';

export const normalFormater  =(id:string,content:string
    ,opt?:{attr?:object,model?:string,prompt_tokens?:number,completion_tokens?:number,total_tokens?:number})=>{
    let rz= {
        id,
        "object": "chat.completion",
        "created": parseInt( ( Date.now()/1000).toFixed(0)),
        "model":opt.model?? "gpt-3.5-turbo",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                content
                },
                "finish_reason": "stop"
            }
        ],
        // "usage": {
        //     "prompt_tokens": opt?.prompt_tokens??0,
        //     "completion_tokens": opt?.completion_tokens??0,
        //     "total_tokens":opt?.total_tokens??0
        // }
    }
    if( opt?.attr){
        rz= {...rz,...opt.attr};
    }
    return rz;
}

// {"id":"chatcmpl-8Hwmc9lXRmt2ovbs5uphgDN8S7JYp","object":"chat.completion.chunk","created":1699288230,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}
// [DONE]
export const  streamFormater =(id:string,content:string
    ,opt?:{attr?:object,model?:string,prompt_tokens?:number,completion_tokens?:number,total_tokens?:number
    ,finish?:boolean})=>{
    let rz={
        id,
        "object": "chat.completion.chunk",
        "created": parseInt( ( Date.now()/1000).toFixed(0)),
         "model":opt.model?? "gpt-3.5-turbo",
        "choices": [
            {
                "index": 0,
                "delta": {
                   content
                },
                "finish_reason":opt.finish?'stop': null //stop
            }
        ]
    }
     if( opt?.attr){
        rz= {...rz,...opt.attr};
    }
    return rz;
     
}

export const toWrite= ( data:any)=>{
    let msg= isString(data)?data: JSON.stringify(data);
    return `data: ${msg}\n\n`;
}

export const dataWrite= (response:Response,data:any)=>{
    response.write(toWrite( data) );
}