

import { ajax } from '@/api';
import { useChat } from '../chat/hooks/useChat'

const { addChat, updateChat, updateChatSome, getChatByUuidAndIndex } = useChat()

export function mjDraw(uuid:number,index:number,chat:Chat.Chat )
{
    //let text = '![CSDN图标](https://cdn.aidutu.cn/res/aidutu/wx.jpg "这是CSDN的图标")';
    chat.dateTime=  new Date().toLocaleString();
    chat.text='等等开始...' ;
    //chat.uri= 'https://cdn.aidutu.cn/res/aidutu/wx.jpg'
    updateChat( +uuid, index,   chat   );
    const url ='/chatgpt/mj/check/'+chat.mj_id 
    //return ajax({url:'/chatgpt/mj/info?v=1.7' })
    let cnt=0;
    return new Promise( h=>{
        //h(1)
        function check(){
             ajax({url  }).then(d=>{
                console.log('d',d );
                const mj:any= d.data.mj;
                let process =  +mj.progress;
                //console.log('mj',process,mj.progress   , mj );
                if( process ==100){
                    chat.dateTime=  new Date().toLocaleString();
                    chat.uri=mj.uri;
                    chat.text= mj.content ;
                    chat.loading= false ; 
                    updateChat( +uuid, index,   chat   );
                    h(1)
                }else if( process ==-100){
                    chat.dateTime=  new Date().toLocaleString();
                    chat.uri=mj.uri;
                    chat.text= '-100';
                    chat.loading= false ; 
                    chat.error_des= mj.error_des ; 
                    updateChat( +uuid, index,   chat   );
                    h(1)
                }else{
                    if( process>-1 ){
                        //console.log('mj234',process,mj.progress  );
                        updateChat( +uuid,  index,
                        {
                            dateTime: new Date().toLocaleString(),
                            text:  `进度...${mj.progress}%`,
                            inversion: false,
                            error: false,
                            loading: true,
                            conversationOptions: chat.conversationOptions,
                            requestOptions:  chat.requestOptions,
                            mj_id:chat.mj_id 
                        })
                    }else if( cnt>500){
                        updateChat( +uuid,  index,
                        {
                            dateTime: new Date().toLocaleString(),
                            text:  `timeout`,
                            inversion: false,
                            error: false,
                            loading: false,
                            conversationOptions: chat.conversationOptions,
                            requestOptions:  chat.requestOptions,
                            mj_id:chat.mj_id 
                        })
                        return ;
                    }
                   
                    // chat.dateTime=  new Date().toLocaleString()
                    // chat.text=`进度...${mj.progress}%`
                    // chat.loading= true ;
                    // updateChat( +uuid, index,   chat   )
                    cnt++;
                    setTimeout( check, 1500 );
                }
             }).catch(()=>h(0) );
        }
        check();
    });
}