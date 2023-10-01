import type { AxiosProgressEvent, GenericAbortSignal } from 'axios'

import {post, Response} from '@/utils/request'
import {useAuthStore, useSettingStore, useUserStore } from '@/store'
import {getIam} from "@/utils/functions";
import axios  from 'axios'



export function fetchChatAPI<T = any>(
  prompt: string,
  options?: { conversationId?: string; parentMessageId?: string },
  signal?: GenericAbortSignal,
) {
  return post<T>({
    url: '/chat',
    data: { prompt, options },
    signal,
  })
}



export function fetchChatConfig<T = any>() {
  return post<T>({
    url: '/config',
  })
}

export function fetchChatAPIProcess<T = any>(
  params: {
    prompt: string
    options?: { conversationId?: string; parentMessageId?: string }
    signal?: GenericAbortSignal
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void
		url?:string
	},
) {
  const settingStore = useSettingStore()

	let token= localStorage.getItem('token');

  const authStore = useAuthStore()

  let data: Record<string, any> = {
    prompt: params.prompt,
    options: params.options,
  }

  if (authStore.isChatGPTAPI) {
    let tokens:number = parseInt( useUserStore().userInfo.tokens )??500;
    if(tokens<=50) tokens=50;
    //tokens = tokens??100
    data = {
      ...data,
      systemMessage: settingStore.systemMessage,
      temperature: settingStore.temperature,
      top_p: settingStore.top_p,
      tokens,
    }
    // Respond using markdown.
    if( useUserStore().userInfo.model==='GPT4.0' )  data.systemMessage='Respond using markdown.';
  }

  return post<T>({
    url: params.url??'/chat-process',
    data,
    signal: params.signal,
		headers:{'x-token':token},
    onDownloadProgress: params.onDownloadProgress,
  })
}

export function fetchSession<T>() {
  // return post<T>({
  //   url: '/session',
  // })
	return new Promise(h=>{
		let json={
			"status": "Success",
			"message": "",
			"data": {
				"auth": false,
				"model": "ChatGPTAPI"
			}
		}
			h(json);
	});
}

export function fetchUser(q:string,isVip:number,data:any={})
{
  //:{'iam':getIam() ,q,isVip}
  data.q=q;
  data.iam= getIam();
  data.isVip= isVip;
	return ajax({url:'/chatgpt/mj/info?v=3',method:'POST',data })
}


export function ajax({ url="",method='GET',data={}}): Promise<Response<any>> {

	const service = axios.create({
		headers: {'Content-Type':'application/json','Accept':'application/json'},
		withCredentials: true,
		baseURL: '/api/cg',
		timeout: 30000 // request timeout
	});
	//
	return new Promise<Response<any>>((h,r)=>{
		service.request({url,method,data,headers:{'x-iam':getIam(),'x-version':'1.5'} }).then(d=>h(d.data)).catch(e=>r(e));
	});
}

export function myTranslate(str:string, system?:string){
  //my/translate
  const service = axios.create({
		headers: {'Content-Type':'application/json','Accept':'application/json'},
		withCredentials: true,
		baseURL: '/',
		timeout: 300000 // request timeout
	});
	
  const url = '/my/translate',method='POST'
  //const system ="Translate into English in any language, No explanation required"
  const st = system??"Translate into English in any language, No explanation required"
  let data= {
    "max_tokens": 1200,
    "model": "gpt-3.5-turbo-0613",
    "temperature": 1,
    "top_p": 1,
    "presence_penalty": 1,
    "messages": [
        {
            "role": "system",
            "content": st
        }, 
        {
            "role": "user",
            "content": str
        }
    ]
};
	return new Promise<Response<any>>((h,r)=>{
		service.request({url,method,data:JSON.stringify( data) }).then(d=>{
    //h(d.data)
    //choices[0].message.content
    if(d.data?.choices[0]?.message?.content ){
     h(  d.data?.choices[0]?.message)
    }
    else{
      console.log( d.data );
      r('发生错误' )
    } 
  }).catch(e=>r(e));
	});
}

export function countTokens(data:any){
  //{prompt_tokens:number, completion_tokens:number,id:string }
  return ajax({url:'/chatgpt/gpt4/tokens',method:'POST',data })
}

export function fetchVerify<T>(token: string) {
  return post<T>({
    url: '/verify',
    data: { token },
  })
}