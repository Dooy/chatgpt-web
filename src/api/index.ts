import type { AxiosProgressEvent, GenericAbortSignal } from 'axios'
<<<<<<< HEAD
import {post, Response} from '@/utils/request'
import { useSettingStore } from '@/store'
import {getIam} from "@/utils/functions";
import axios  from 'axios'


=======
import { post } from '@/utils/request'
import { useAuthStore, useSettingStore } from '@/store'
>>>>>>> upstream/main

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
<<<<<<< HEAD
	let token= localStorage.getItem('token');
=======
  const authStore = useAuthStore()

  let data: Record<string, any> = {
    prompt: params.prompt,
    options: params.options,
  }

  if (authStore.isChatGPTAPI) {
    data = {
      ...data,
      systemMessage: settingStore.systemMessage,
      temperature: settingStore.temperature,
      top_p: settingStore.top_p,
    }
  }
>>>>>>> upstream/main

  return post<T>({
    url: '/chat-process',
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

export function fetchUser(q)
{

	return ajax({url:'/chatgpt/user/info?v=1.3',method:'POST',data:{'iam':getIam() ,q} })
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
		service.request({url,method,data,headers:{'x-iam':getIam()} }).then(d=>h(d.data)).catch(e=>r(e));
	});
}

export function fetchVerify<T>(token: string) {
  return post<T>({
    url: '/verify',
    data: { token },
  })
}
