
import { Request, Response, NextFunction } from 'express';
import { dataWrite, streamFormater } from './gptformart';
import { generateRandomCode, mlog } from './utils';

export const debug= ( response:Response, body:any )=>{
    const headers = {
			'Content-Type': 'text/event-stream',
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache'
		};
    const id= 'mj-'+ generateRandomCode(16);
    response.writeHead(200, headers); 

    const json = JSON.parse( body );
    //dataWrite(response, streamFormater(id ,'hello 你好' ,{model:'midjourney' } )  );
    //dataWrite(response, streamFormater(id ,'你的写作内容：' ,{model:'midjourney' } )  );
    //dataWrite(response, streamFormater(id , body ,{model:'midjourney' } )  );
    dataWrite(response, streamFormater(id , botton2text(json ) ,{model:'midjourney' } )  );
    dataWrite(response, streamFormater(id ,'' ,{model:'midjourney',finish:true} )  );
    dataWrite(response,  "[DONE]"  );
    response.end();
}


export const botton2text= ( botton:any[])=>{
    //mlog('botton', botton );
    //f( )
    let rz = '';
    botton.map((v,i )=>{
        let label= v.label!=''? v.label:'';
        if( v.emoji == '🔄') label+='重绘';

        rz+=`\n${i+1} ${ v.emoji +label } `;
    });
    if( rz=='') return "无可操作指令";
    return "\n按下面提示回复***数字***来操作图片："+rz;

}