import { ss } from '@/utils/storage'

const LOCAL_NAME = 'userStorage'

export interface UserInfo {
  avatar: string
  name: string
  description: string
	isVip:number
	doLogin:number
  model: string
  tokens: string
}

export interface UserState {
  userInfo: UserInfo
}

export function defaultSetting(): UserState {
  return {
    userInfo: {
      //avatar: 'https://raw.githubusercontent.com/Chanzhaoyu/chatgpt-web/main/src/assets/avatar.jpg',
      avatar: 'https://cdn.aidutu.cn/res/img/beke.jpg',
      name: 'AiBeKe',
      //description: '友链 <a href="https://123.lingduquan.com" class="text-blue-500" target="_blank" >AI网站导航</a>',
      description: '<a href="https://docs.qq.com/doc/DUnlOTlN2cHVjdkRT" class="text-blue-500" target="_blank" >免责申明</a>',
			isVip:( location.href.indexOf('localhost')>-1 || location.href.indexOf('vip.aidutu.cn')>-1 ||  location.href.indexOf('vip')>-1 )?1:0 //
			,doLogin:0
      ,model: 'GPT3.5'
      ,tokens: '1000'
    },
  }
}

export function getLocalState(): UserState {
  const localSetting: UserState | undefined = ss.get(LOCAL_NAME)
  return { ...defaultSetting(), ...localSetting }
}

export function setLocalState(setting: UserState): void {
  ss.set(LOCAL_NAME, setting)
}
