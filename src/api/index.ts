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
	return ajax({url:'/chatgpt/user/info?v=3.0',method:'POST',data })
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
