<script setup lang='ts'>
import type { Ref } from 'vue'
import {computed, onMounted, onUnmounted, ref, watch} from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { NAutoComplete, NButton, NInput, useDialog, useMessage,NModal } from 'naive-ui'
import html2canvas from 'html2canvas'
import { Message } from './components'
import { useScroll } from './hooks/useScroll'
import { useChat } from './hooks/useChat'
import { useCopyCode } from './hooks/useCopyCode'
import { useUsingContext } from './hooks/useUsingContext'
import HeaderComponent from './components/Header/index.vue'
import { HoverButton, SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useChatStore, usePromptStore,useUserStore } from '@/store'
import {ajax, fetchChatAPIProcess, fetchUser} from '@/api' //
import { t } from '@/locales'
//import AiWeixin from "@/views/aidutu/aiWeixin.vue";
import AiMsg from "@/views/aidutu/aiMsg.vue";
import AiWeixinlogin from "@/views/aidutu/aiWeixinlogin.vue";
import {getCookieUserInfo} from "@/utils/functions";
import AiDasan from "@/views/aidutu/aiDasan.vue";
import AiFirst from "@/views/aidutu/aiFirst.vue";
import AiOpenVip from "@/views/aidutu/aiOpenVip.vue";

let controller = new AbortController()

const openLongReply = import.meta.env.VITE_GLOB_OPEN_LONG_REPLY === 'true'

const route = useRoute()
const dialog = useDialog()
const ms = useMessage()

const chatStore = useChatStore()

useCopyCode()

const { isMobile } = useBasicLayout()
const { addChat, updateChat, updateChatSome, getChatByUuidAndIndex } = useChat()
const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom } = useScroll()
const { usingContext, toggleUsingContext } = useUsingContext()

const { uuid } = route.params as { uuid: string }

const dataSources = computed(() => chatStore.getChatByUuid(+uuid))
const conversationList = computed(() => dataSources.value.filter(item => (!item.inversion && !item.error)))

const prompt = ref<string>('')
const loading = ref<boolean>(false)
const inputRef = ref<Ref | null>(null)

const isWechat = ref( /MicroMessenger/i.test(navigator.userAgent) ); //是否在微信内

// 添加PromptStore
const promptStore = usePromptStore()

// 使用storeToRefs，保证store修改后，联想部分能够重新渲染
const { promptList: promptTemplate } = storeToRefs<any>(promptStore)

// 未知原因刷新页面，loading 状态不会重置，手动重置
dataSources.value.forEach((item, index) => {
  if (item.loading)
    updateChatSome(+uuid, index, { loading: false })
})

function showLoginWx(){
	dialog.warning({
		title: '当前状态未登录',
		content: "使用 AiDuTu 必须先登录",
		positiveText: "去登录",
		negativeText:'取消',
		onPositiveClick: () => {
			//chatStore.clearChatByUuid(+uuid)
			location.href='https://www.lingduquan.com/oauth/weixin?f=chat'
		},
	});
}
function handleSubmit() {
	//就是在这个地方需要去请求是用户是否有权限
	//console.log('提交之前 做下过滤 检查是否登录了');
	getToken( prompt.value, onConversation );

}
const serverInfo=ref({'uid':0,isAd:0,tm:3000,error:''})
function getToken( str:string ,func=()=>{}){
	fetchUser( str,userInfo.value.isVip ).then(d=>{
		console.log('vip',d);
		if(d.error==317){
			if(isWechat.value){
				showLoginWx();
				return;
			}
			isShowWx.value=true;
			return;
		}
		else if(d.error>0) {
			msgRef.value.showError( d.error_des );
			return ;
		}
		if(userInfo.value.isVip && d.data.uvip.isOver!=0){ //data.uvip.isOver
			isOpenVip.value=true;
			return;
		}



		localStorage.setItem('token', d.data.token )
		if(d.data && d.data.info){
			serverInfo.value= d.data.info
		}
		func()

		if(d.data && d.data.info && d.data.info.zan){
			show2.value=true
		}


	}).catch(e=>{
		console.log('error',e);

	} )
}

//问题过滤 过滤
function fingler( str:string ):string{
	 return  str.replace(/openai/ig,'duTuAi').replace(/ChatGPT/ig,'AI');
}
//答案过滤
/*function daanFingler( data:any,uuid:any,index:any,chat:any) {
	if(data.detail.choices[0].finish_reason === 'stop'){
		console.log('daanFingler stop');
		//chat.text= " daanFingler stop ";
		ajax({
			url:'/chatgpt/word/check',
			method:"POST"
			,data:{q:chat.text}
		}).then(d=>{
			console.log('stop', d ); //data.rz
			if(d.data.rz){
				chat.text= d.data.rz;
				updateChat(uuid, index, chat)
			}
		});
	}
}*/
//答案过滤V2
function daanFinglerV2(uuid:number, index:number) {

	const currentChat = getChatByUuidAndIndex(uuid, index ) ;//+uuid, dataSources.value.length - 1

	if (currentChat?.text && currentChat.text !== '') {

		ajax({
			url:'/chatgpt/word/check',
			method:"POST"
			,data:{q:currentChat.text}
		}).then(d=>{
			console.log('stop', d ); //data.rz
			if(d.data.rz){
				//chat.text= d.data.rz;
				updateChatSome( //这个地方要去过滤下
					uuid, index,
					{
						text: d.data.rz,
						error: false,
						loading: false,
					},
				)
				return
			}
		});

	}

}

//adfun
const adFun = (uuid:number,index:number) => {
	//console.log('adFun');
	if(serverInfo.value.isAd!=1) return ;
	setTimeout(()=>{
		const currentChat = getChatByUuidAndIndex(uuid, index ) ;
		//console.log('adFun', currentChat );
		if( currentChat?.text && currentChat.text=='Thinking...'){
			//console.log('adFun', 'Thanks....' );
			updateChatSome(
				uuid, index,
				{
					text: 'Thinking...[慢？可尝试我们的VIP通道，快速出答案](https://vip.aidutu.cn/?tk) ',
				})
		}
	},serverInfo.value.tm?serverInfo.value.tm:3000);

}

async function onConversation() {
  let message = prompt.value

  if (loading.value)
    return

  if (!message || message.trim() === '')
    return

  controller = new AbortController()

  addChat(
    +uuid,
    {
      dateTime: new Date().toLocaleString(),
      text: message,
      inversion: true,
      error: false,
      conversationOptions: null,
      requestOptions: { prompt: message, options: null },
    },
  )
  scrollToBottom()

  loading.value = true
  prompt.value = ''

  let options: Chat.ConversationRequest = {}
  const lastContext = conversationList.value[conversationList.value.length - 1]?.conversationOptions

  if (lastContext && usingContext.value)
    options = { ...lastContext }

	let think ='Thinking...';
  addChat(
    +uuid,
    {
      dateTime: new Date().toLocaleString(),
      text: think ,
      loading: true,
      inversion: false,
      error: false,
      conversationOptions: null,
      requestOptions: { prompt: message, options: { ...options } },
    },
  )
  scrollToBottom()

  try {
		adFun( +uuid, dataSources.value.length - 1 );
    let lastText = ''
    const fetchChatAPIOnce = async () => {
      await fetchChatAPIProcess<Chat.ConversationResponse>({
        prompt: message,
        options,
        signal: controller.signal,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target
          const { responseText } = xhr
          // Always process the final line
          const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
          let chunk = responseText
          if (lastIndex !== -1)
            chunk = responseText.substring(lastIndex)
          try {
            const data = JSON.parse(chunk)
            updateChat(
              +uuid,
              dataSources.value.length - 1,
              {
                dateTime: new Date().toLocaleString(),
                text: fingler(lastText + data.text ?? ''),
                inversion: false,
                error: false,
                loading: true,
                conversationOptions: { conversationId: data.conversationId, parentMessageId: data.id },
                requestOptions: { prompt: message, options: { ...options } },
              },
            )

            if (openLongReply && data.detail.choices[0].finish_reason === 'length') {
              options.parentMessageId = data.id
              lastText = data.text
              message = ''
              return fetchChatAPIOnce()
            }

            scrollToBottomIfAtBottom()
          }
          catch (error) {
            //
          }
        },
      })
      updateChatSome(+uuid, dataSources.value.length - 1, { loading: false })
    }

    await fetchChatAPIOnce()
  }
  catch (error: any) {
    let errorMessage = error?.message ?? t('common.wrong')
		// if( ! userInfo.value.isVip) errorMessage= "抱歉，用户太多，余额耗尽了，站长正在充值的路上，请收藏下网址，等会再试试吧。欢迎给我们打赏帮我们分担一些成本。\n\n" + errorMessage;
		// else errorMessage ="稍后尝试\n\n"+ errorMessage;
		if(serverInfo.value.error )  errorMessage = serverInfo.value.error + errorMessage;
    if (error.message === 'canceled') {
      updateChatSome(
        +uuid,
        dataSources.value.length - 1,
        {
          loading: false,
        },
      )
      scrollToBottomIfAtBottom()
      return
    }

    const currentChat = getChatByUuidAndIndex(+uuid, dataSources.value.length - 1)

    if (currentChat?.text && currentChat.text !== '') {
      updateChatSome( //这个地方要去过滤下
        +uuid,
        dataSources.value.length - 1,
        {
          text: `${currentChat.text}\n[${errorMessage}]`,
          error: false,
          loading: false,
        },
      )
      return
    }


    updateChat(
      +uuid,
      dataSources.value.length - 1,
      {
        dateTime: new Date().toLocaleString(),
        text: errorMessage,
        inversion: false,
        error: true,
        loading: false,
        conversationOptions: null,
        requestOptions: { prompt: message, options: { ...options } },
      },
    )
    scrollToBottomIfAtBottom()
  }
  finally {
		//当前过滤
		//console.log('当前过滤' , dataSources.value.length - 1 );
		daanFinglerV2( +uuid, dataSources.value.length - 1 );
    loading.value = false
  }
}
async function onRegenerateD(index: number) {
	if (loading.value) return
	getToken("",()=>onRegenerate(index));

}
async function onRegenerate(index: number) {
  if (loading.value)
    return

  controller = new AbortController()

  const { requestOptions } = dataSources.value[index]

  let message = requestOptions?.prompt ?? ''

  let options: Chat.ConversationRequest = {}

  if (requestOptions.options)
    options = { ...requestOptions.options }

  loading.value = true

  updateChat(
    +uuid,
    index,
    {
      dateTime: new Date().toLocaleString(),
      text: 'Thinking...',
      inversion: false,
      error: false,
      loading: true,
      conversationOptions: null,
      requestOptions: { prompt: message, options: { ...options } },
    },
  )

  try {
		adFun( +uuid,  index );
    let lastText = ''
    const fetchChatAPIOnce = async () => {
      await fetchChatAPIProcess<Chat.ConversationResponse>({
        prompt: message,
        options,
        signal: controller.signal,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target
          const { responseText } = xhr
          // Always process the final line
          const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
          let chunk = responseText
          if (lastIndex !== -1)
            chunk = responseText.substring(lastIndex)
          try {
            const data = JSON.parse(chunk)
            updateChat(
              +uuid,
              index,
              {
                dateTime: new Date().toLocaleString(),
                text: fingler( lastText + data.text ?? ''),
                inversion: false,
                error: false,
                loading: true,
                conversationOptions: { conversationId: data.conversationId, parentMessageId: data.id },
                requestOptions: { prompt: message, options: { ...options } },
              },
            )

            if (openLongReply && data.detail.choices[0].finish_reason === 'length') {
              options.parentMessageId = data.id
              lastText = data.text
              message = ''
              return fetchChatAPIOnce()
            }

          }
          catch (error) {
            //
          }
        },
      })
      updateChatSome(+uuid, index, { loading: false })
    }
    await fetchChatAPIOnce()
  }
  catch (error: any) {
    if (error.message === 'canceled') {
      updateChatSome(
        +uuid,
        index,
        {
          loading: false,
        },
      )
      return
    }

    const errorMessage = error?.message ?? t('common.wrong')

    updateChat(
      +uuid,
      index,
      {
        dateTime: new Date().toLocaleString(),
        text: errorMessage,
        inversion: false,
        error: true,
        loading: false,
        conversationOptions: null,
        requestOptions: { prompt: message, options: { ...options } },
      },
    )
  }
  finally {
		//console.log('当前过滤3' , index );
		daanFinglerV2(	+uuid, index);
    loading.value = false
  }
}

function handleExport() {
  if (loading.value)
    return

  const d = dialog.warning({
    title: t('chat.exportImage'),
    content: t('chat.exportImageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: async () => {
      try {
        d.loading = true
        const ele = document.getElementById('image-wrapper')
        const canvas = await html2canvas(ele as HTMLDivElement, {
          useCORS: true,
        })
        const imgUrl = canvas.toDataURL('image/png')
        const tempLink = document.createElement('a')
        tempLink.style.display = 'none'
        tempLink.href = imgUrl
        tempLink.setAttribute('download', 'chat-shot.png')
        if (typeof tempLink.download === 'undefined')
          tempLink.setAttribute('target', '_blank')

        document.body.appendChild(tempLink)
        tempLink.click()
        document.body.removeChild(tempLink)
        window.URL.revokeObjectURL(imgUrl)
        d.loading = false
        ms.success(t('chat.exportSuccess'))
        Promise.resolve()
      }
      catch (error: any) {
        ms.error(t('chat.exportFailed'))
      }
      finally {
        d.loading = false
      }
    },
  })
}

function handleDelete(index: number) {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.deleteMessage'),
    content: t('chat.deleteMessageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.deleteChatByUuid(+uuid, index)
    },
  })
}

function handleClear() {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.clearChat'),
    content: t('chat.clearChatConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.clearChatByUuid(+uuid)
    },
  })
}

function go(v:any){
	console.log('go',v);
	prompt.value =v.v;
	handleSubmit();
}

function handleEnter(event: KeyboardEvent) {
  if (!isMobile.value) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
  else {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
}

function handleStop() {
  if (loading.value) {
    controller.abort()
    loading.value = false
  }
}

// 可优化部分
// 搜索选项计算，这里使用value作为索引项，所以当出现重复value时渲染异常(多项同时出现选中效果)
// 理想状态下其实应该是key作为索引项,但官方的renderOption会出现问题，所以就需要value反renderLabel实现
const searchOptions = computed(() => {
  if (prompt.value.startsWith('/')) {
    return promptTemplate.value.filter((item: { key: string }) => item.key.toLowerCase().includes(prompt.value.substring(1).toLowerCase())).map((obj: { value: any }) => {
      return {
        label: obj.value,
        value: obj.value,
      }
    })
  }
  else {
    return []
  }
})

// value反渲染key
const renderOption = (option: { label: string }) => {
  for (const i of promptTemplate.value) {
    if (i.value === option.label)
      return [i.key]
  }
  return []
}

const placeholder = computed(() => {
  if (isMobile.value)
    return t('chat.placeholderMobile')
  return t('chat.placeholder')
})

const buttonDisabled = computed(() => {
  return loading.value || !prompt.value || prompt.value.trim() === ''
})

const footerClass = computed(() => {
  let classes = ['p-4']
  if (isMobile.value)
    classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
  return classes
})

onMounted(() => {
  scrollToBottom()
  if (inputRef.value && !isMobile.value)
    inputRef.value?.focus()

	if(isWechat.value) {
		let u = getCookieUserInfo();
		if (!u) showLoginWx();
	}

})

onUnmounted(() => {
  if (loading.value)
    controller.abort()
})


const msgRef = ref();
const isShowWx= ref(false);
const show2=ref(false);
const loginSuccess=()=>{
	msgRef.value.showMsg('登录成功！');
	isShowWx.value=false;
	handleSubmit();
	userStore.updateUserInfo({doLogin:4})
}

const isOpenVip=ref(false)
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const goLogin= ()=>{
	isOpenVip.value=false;
	if(isWechat.value) {
		showLoginWx();
	}else{
		isShowWx.value=true;
	}
}
watch(userInfo, (val, o) =>{
	if (val.doLogin==2 && o?.doLogin!=2)   goLogin();
	else if( val.doLogin==1) isOpenVip.value=true;
}, {immediate: true, flush: 'post'} )

const vipClose = () => {
	userStore.updateUserInfo({doLogin:0})
}
vipClose()

const serverMsg=ref({des:'显示内容支持html',is:false })
const openSuccess = () => {
	setTimeout(()=>isOpenVip.value=false,1500)
}
</script>

<template>
	<ai-msg ref="msgRef"></ai-msg>
	<NModal v-model:show="isShowWx" style=" width: 350px;" preset="card" :on-after-enter="vipClose">
		<ai-weixinlogin @success="loginSuccess" v-if="isShowWx"></ai-weixinlogin>
	</NModal>

	<NModal v-model:show="show2" style=" width: 450px;" preset="card" >
		<ai-dasan></ai-dasan>
	</NModal>
	<NModal v-model:show="serverMsg.is" style=" width: 450px;" preset="card" >
		<div v-html="serverMsg.des"></div>
	</NModal>




  <div class="flex flex-col w-full h-full">
    <HeaderComponent
      v-if="isMobile"
      :using-context="usingContext"
      @export="handleExport"
      @toggle-using-context="toggleUsingContext"
    />
    <main class="flex-1 overflow-hidden">
      <div id="scrollRef" ref="scrollRef" class="h-full overflow-hidden overflow-y-auto">
        <div
          id="image-wrapper"
          class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"
          :class="[isMobile ? 'p-2' : 'p-4']"
        >
          <template v-if="!dataSources.length">
						<ai-first  @go="go" ></ai-first>
          </template>
          <template v-else>
						<NModal v-model:show="isOpenVip" style=" width: 550px;" preset="card" title="会员充值续费"  :on-after-enter="vipClose">
							<ai-open-vip   v-if="isOpenVip" @success="openSuccess"></ai-open-vip>
						</NModal>
            <div>
              <Message
                v-for="(item, index) of dataSources"
                :key="index"
                :date-time="item.dateTime"
                :text="item.text"
                :inversion="item.inversion"
                :error="item.error"
                :loading="item.loading"
                @regenerate="onRegenerateD(index)"
                @delete="handleDelete(index)"
              />
              <div class="sticky bottom-0 left-0 flex justify-center">
                <NButton v-if="loading" type="warning" @click="handleStop">
                  <template #icon>
                    <SvgIcon icon="ri:stop-circle-line" />
                  </template>
									{{$t('chat.stop')}}
                </NButton>
              </div>
            </div>
          </template>
        </div>
      </div>
    </main>
    <footer :class="footerClass">
      <div class="w-full max-w-screen-xl m-auto">
        <div class="flex items-center justify-between space-x-2">
          <HoverButton @click="handleClear">
            <span class="text-xl text-[#4f555e] dark:text-white">
              <SvgIcon icon="ri:delete-bin-line" />
            </span>
          </HoverButton>
          <HoverButton v-if="!isMobile" @click="handleExport">
            <span class="text-xl text-[#4f555e] dark:text-white">
              <SvgIcon icon="ri:download-2-line" />
            </span>
          </HoverButton>
          <HoverButton v-if="!isMobile" @click="toggleUsingContext">
            <span class="text-xl" :class="{ 'text-[#4b9e5f]': usingContext, 'text-[#a8071a]': !usingContext }">
              <SvgIcon icon="ri:chat-history-line" />
            </span>
          </HoverButton>
          <NAutoComplete v-model:value="prompt" :options="searchOptions" :render-label="renderOption">
            <template #default="{ handleInput, handleBlur, handleFocus }">
              <NInput
                ref="inputRef"
                v-model:value="prompt"
                type="textarea"
                :placeholder="placeholder"
                :autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }"
                @input="handleInput"
                @focus="handleFocus"
                @blur="handleBlur"
                @keypress="handleEnter"
              />
            </template>
          </NAutoComplete>
          <NButton type="primary" :disabled="buttonDisabled" @click="handleSubmit">
            <template #icon>
              <span class="dark:text-black">
                <SvgIcon icon="ri:send-plane-fill" />
              </span>
            </template>
          </NButton>
        </div>
      </div>
    </footer>
  </div>

</template>

