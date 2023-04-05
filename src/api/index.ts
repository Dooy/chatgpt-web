import type { AxiosProgressEvent, GenericAbortSignal } from 'axios'
import {post, Response} from '@/utils/request'
import { useSettingStore } from '@/store'
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
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void },
) {
  const settingStore = useSettingStore()
	let token= localStorage.getItem('token');

  return post<T>({
    url: '/chat-process',
    data: { prompt: params.prompt, options: params.options, systemMessage: settingStore.systemMessage },
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

export function fetchUser(q)
{

	return ajax({url:'/chatgpt/user/info?v=1.0',method:'POST',data:{'iam':getIam() ,q} })
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
		service.request({url,method,data}).then(d=>h(d.data)).catch(e=>r(e));
	});
}

export function fetchVerify<T>(token: string) {
  return post<T>({
    url: '/verify',
    data: { token },
  })
}
