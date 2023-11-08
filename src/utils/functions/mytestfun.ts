import axios from "axios";
//记得引入 `axios`
export const chatGPTSee=( msg:string, opt:any )=>{
    //let content=''; 
    const dataPar=(data)=>{
        let rz = {};
        let dz= data.split('data:',2);
        const str = dz[1].trim();
        if(str=='[DONE]') rz={ finish:true,text:''};
        else{
            rz=JSON.parse(str); 
            rz.text= rz.choices[0].delta.content;
        }
        return rz ;
    }
    const dd= ( data:any  )=>{
        let arr = data.trim().split("\n\n");
        let rz={text:'',arr:[]};
        const atext= arr.map(v=>{
        const aa= dataPar(v);
        return aa.text;
        });
        rz.arr= atext;
        rz.text= atext.join("");
        if( opt.onMessage)  opt.onMessage(rz);
        return rz ;
    }
    return new Promise((resolve, reject) => {
        axios({
        method: 'post',
        url: 'https://api.openai-hk.com/v1/chat/completions',
        data: {
            "max_tokens": 1200, 
            "model": "gpt-3.5-turbo", //模型替换 如需调用4.0，改为gpt-4或gpt-4-0613即可
            "temperature": 0.8,
            "top_p": 1,
            "presence_penalty": 1,
            "messages": [
                {
                    "role": "system",
                    "content": opt.system??"You are ChatGPT"
                },
                {
                    "role": "user",
                    "content": msg 
                }
            ],
            "stream": true //数据流方式输出
        },
        headers:{
            'Content-Type': 'application/json',
            'Authorization': 'Bearer hk-你的key'
        },
        onDownloadProgress: e=>dd(  e.target.responseText)
        })
        .then(d=>  resolve(dd(d.data) ))
        .catch(e=> reject(e ) );

    })   
}

const content2ImgMarkdown=( d:any[] )=>{
    let text='';
    d.map((v,i)=>{
        text +=`![img${i+1}](${v.asset_pointer}) `
    });
    if(text!='') text ="```\n"+ text  + "\n```\n";
    return text;
}
export const webParse=(data:string)=>{
    let rz = {text:'',finish:false,is:true,type:''};
    if( data.indexOf('data:')!=0) return rz ;

    let dz= data.split('data:',2);
    
    const str = dz[1].trim();
    if(str=='[DONE]') rz.finish=true;
    else{
        const json =JSON.parse(str); 
        //rz.text= rz;
        if(json.message){
            rz.type= json.message.content.content_type; //message.content.content_type
            console.error('type',    rz.type  );

            if( rz.type=='multimodal_text'){ //画图
                 rz.text= content2ImgMarkdown( json.message.content.parts );
                 console.error('出图了',  rz.text );
            }else if(rz.type=='code'){
                 rz.text="```"+json.message.content.language+"\n"+json.message.content.text  + "\n```\n";
            }else if(rz.type=='text'){
                rz.text= json.message.content.parts.join("\n\n");
            }else{
                
            }
        }else rz.is=false

    }
    return rz ;
}
export const webGetContext= (str:string )=>{
    let arr = str.trim().split("\n\n");
    //let rz={text:'',arr:[]};
    let content = {text:''};
    let image= {text:''}
    //message.content.content_type
    arr.map(v=>{
        try{
            const aa= webParse(v);
            if(!aa.finish && aa.is ) content=aa;
            if(aa.type=='multimodal_text') image=aa;
            return aa.text;
        }catch(e){
            mlog('错误',e , v );
            return '' ;
        }
    });
    if(image.text!=''){
        content.text= image.text+"\n"+ content.text;
    }
    return content;
}
export const mysse = (
    url:string,
    options: Parameters<typeof axios>[1] & {
        onMessage: (data: string) => void
        onError?: (error: any) => void
    }
)=>{
    const { onMessage, onError, ...axiosOptions } = options; 
    const myOptin= {...axiosOptions,url, onDownloadProgress:(e:any)=>onMessage( e.target?.responseText?? e.event.currentTarget.responseText   )};


     return new Promise((resolve, reject) => {
        mlog('开始执行啊')
        axios(myOptin).then(d=>  resolve( d.data ))
        .catch(e=> reject(e ) );
     });
}

export const mlog = (msg: string, ...args: unknown[]) => {
    //localStorage.setItem('debug',1 )
    const logStyles = [
    // 'padding: 4px 8px',
    // 'color: #fff',
    // 'border-radius: 3px',
    'color:',
  ].join(';')
    const debug= localStorage.getItem('debug')
    if( !debug  ) return ;
    const style = `${logStyles}${msg.includes('error') ? 'red' : '#dd9089'}`
    console.log(`%c[mygpt]`,  style, msg , ...args)
}

// //调用
// chatGPT( '你是谁？' 
//   ,{
//       //system:'', //角色定义
//       onMessage: d=> console.log('过程性结果：',d.text  ) 
//     }
// ).then( d=> console.log('✅最终结果：', d ) ).catch( e=>  console.log('❎错误：', e )  );