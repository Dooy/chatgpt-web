<script lang="ts" setup >
import { computed, onMounted, onUnmounted, onUpdated, ref,watch } from 'vue'
import MarkdownIt from 'markdown-it'
import mdKatex from '@traptitech/markdown-it-katex'
import mila from 'markdown-it-link-attributes'
import hljs from 'highlight.js'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { t } from '@/locales'
//import { copyText3} from '@/utils/format'
import AiMsg from "@/views/aidutu/aiMsg.vue";
import { copyToClip } from '@/utils/copy'
import {  NButton, NSpace,NImage,NModal ,NTooltip } from "naive-ui"
import { getImg,img2base64, saveImg } from '@/views/aidutu/mj'
import { useRoute } from 'vue-router'
import { useChat } from  '@/views/chat/hooks/useChat'
import { SvgIcon } from '@/components/common'
import { aiCanvas } from "@/views/aidutu";

const {  updateChat  } = useChat()
const route = useRoute()
const { uuid } = route.params as { uuid: string }



interface Props {
  inversion?: boolean
  error?: boolean
  text?: string
  loading?: boolean
  asRawText?: boolean
  chat?:Chat.Chat
  index?:number
}

const props = defineProps<Props>()

const { isMobile } = useBasicLayout()

const textRef = ref<HTMLElement>()

const mdi = new MarkdownIt({
  html: false,
  linkify: true,
  highlight(code, language) {
    const validLang = !!(language && hljs.getLanguage(language))
    if (validLang) {
      const lang = language ?? ''
      return highlightBlock(hljs.highlight(code, { language: lang }).value, lang)
    }
    return highlightBlock(hljs.highlightAuto(code).value, '')
  },
})

mdi.use(mila, { attrs: { target: '_blank', rel: 'noopener' } })
mdi.use(mdKatex, { blockClass: 'katexmath-block rounded-md p-[10px]', errorColor: ' #cc0000' })

const wrapClass = computed(() => {
  return [
    'text-wrap',
    'min-w-[20px]',
    'rounded-md',
    isMobile.value ? 'p-2' : 'px-3 py-2',
    props.inversion ? 'bg-[#d2f9d1]' : 'bg-[#f4f6f8]',
    props.inversion ? 'dark:bg-[#a1dc95]' : 'dark:bg-[#1e1e20]',
    props.inversion ? 'message-request' : 'message-reply',
    { 'text-red-500': props.error },
  ]
})

const text = computed(() => {
  const value = props.text ?? ''

  if (!props.asRawText)
    return mdi.render(value)
  return value
})

function highlightBlock(str: string, lang?: string) {
  return `<pre class="code-block-wrapper"><div class="code-block-header"><span class="code-block-header__lang">${lang}</span><span class="code-block-header__copy">${t('chat.copyCode')}</span></div><code class="hljs code-block-body ${lang}">${str}</code></pre>`
}


const guolv= (txt:string)=>{
	//console.log( 'abc==>',txt );
	if(txt.indexOf('vip.aidutu.cn')>-1) return txt;
	txt = txt.replace(/href="([^"]*)"/ig, 'href="https://www.aidutu.cn/info/link?url=$1"');
	txt = txt.replace(/href='([^']*)'/ig, 'href="https://www.aidutu.cn/info/link?url=$1"');
	return txt;
}
const childRef = ref();
defineExpose({ textRef })
function addCopyEvents() {
  if (textRef.value) {
    const copyBtn = textRef.value.querySelectorAll('.code-block-header__copy')
    copyBtn.forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.parentElement?.nextElementSibling?.textContent
        if (code) {
          copyToClip(code).then(() => {
            btn.textContent = '复制成功'
            setTimeout(() => {
              btn.textContent = '复制代码'
            }, 1000)
          })
        }
      })
    })
  }
}

function removeCopyEvents() {
  if (textRef.value) {
    const copyBtn = textRef.value.querySelectorAll('.code-block-header__copy')
    copyBtn.forEach((btn) => {
      btn.removeEventListener('click', () => {})
    })
  }
}

onMounted(() => {
  addCopyEvents()
})

onUpdated(() => {
  addCopyEvents()
})

onUnmounted(() => {
  removeCopyEvents()
})

const st = ref( {fg:[1,2,3,4],big:[1,2,3,4] ,isLoadImg:true, uri_base64:'', bts:[],isShow:false})
const emits = defineEmits(['imageSend'  ])

async function loadImage(){
  //chat.uri+'?imageMogr2/format/webp'
   if(props.chat?.uri_base64){
    let rz = await loadLocalImg();
    if ( rz)return ;
   }
  if( props.chat?.uri){
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload=()=>{
      st.value.isLoadImg=false;
      emits('imageSend', {t:'loadImage',chat :props.chat})
    
      const img64 = img2base64(img) ; 
      //console.log('base64>>', img64 )
      if( img64 ){
        st.value.uri_base64= img64;
        const kk=`server:${uuid}:${props.index}:${ Date.now() }`;
        saveImg( kk ,JSON.stringify( {img: img64}));
        let cchat = props.chat;
        if( !cchat || props.index==undefined) return ;
        cchat.uri_base64= kk;
        updateChat( +uuid,props.index,cchat );
      }
    }
    img.onerror=()=>{
      console.log("载入失败 最好从新载入");
      loadImage();
    }
    img.src =  props.chat.uri+'?imageMogr2/format/webp';
  }else{
    // st.value.isLoadImg=false;
  }
}

 
async function loadLocalImg(){
    if(!props.chat?.uri_base64) return true;
    try{
      const obj = JSON.parse( await getImg( props.chat?.uri_base64) );
      st.value.uri_base64 = obj.img ; 
      emits('imageSend', {t:'loadImage',chat :props.chat})
    }catch(ee){
      return false;
    }
    
    //console.log("uri_base64",  st.value.uri_base64 ); 
  
    return true;
}
loadImage()
//loadLocalImg();


//const chatUri = computed(() =>  props.chat?.uri );
watch(() =>  props.text, (newValue, oldValue) => {
      //console.log('props updated!', newValue, oldValue)
      loadImage()
      emits('imageSend', {t:'loadImage',chat :props.chat})
},{ deep: true})

const getBts= ()=>{
   //props.chat?.mj_id? localStorage.getItem('mj_'+props.chat?.mj_id):[];
   if( !props.chat?.mj_id) return [];
   const str= localStorage.getItem('mj_'+props.chat?.mj_id);
   if(!str) return [];
    
   return JSON.parse(str)??[]; 
}

//console.log('uuid', uuid,props.index )
st.value.bts =getBts();

const checkBt  = (act:string)=>{
  if(! props.chat?.mj_bt) {
    if(['v34'].indexOf(act)>-1 ) return false;
    return true;
  }
  //console.log('act', act );
  return props.chat.mj_bt.indexOf(act)>-1;
  //return false;
}
const imageSend= ( act:any)=>{
  let cbt= st.value.bts;
  cbt.push( act.t + act.v );
  emits('imageSend',act );
  localStorage.setItem( 'mj_'+props.chat?.mj_id, JSON.stringify(cbt)); 
}
const isDo= (act:string)=>{
  return st.value.bts.indexOf(act)>-1;
}
const maskOk=(d:any)=>{
  //console.log('maskOk',d  );
  imageSend({t:'V',v: 23,chat:props?.chat,  data:{ mask:d.mask,prompt:d.prompt} })
   st.value.isShow= false;
}
//st.isShow=true
const goCanvan=()=>{
  if(st.value.uri_base64==''){
    childRef.value.showMsg("还在载入图片...请稍等");
    return ;
  }
  st.value.isShow= true;
}
</script>

<template>
	<ai-msg ref="childRef"></ai-msg>
  <div class="text-black" :class="wrapClass">
    <div ref="textRef" class="leading-relaxed break-words" :class="{'mmWidth':!isMobile}">
      <div v-if="!inversion" class="flex items-end">
        <div v-if="chat?.uri" class="w-full markdown-body"  >
          <div v-text="props.text"></div>
           <div v-if="st.uri_base64" style="margin-top: 10px;">
            <n-image :src="st.uri_base64" class="maxCss" style="border-radius: 3px;" /> 
            <!-- :class="{'maxCss':!isMobile}" -->
          </div>
          <div v-else-if="st.isLoadImg" style="text-align: center; padding: 60px 20px;">
            <div  @click="loadImage">正在载入图片...</div> 
            <div  style="margin-top: 10px;text-align: center;"><n-button   type="primary"   size="small" ><a :href="chat?.uri+'?imageMogr2/format/webp'" target="_blank" style="color: #333;">查看原图</a></n-button></div> 
          </div>
          <div style="position: relative; margin-top: 15px; " v-else>
            <a :href="chat?.uri+'?imageMogr2/format/webp'" target="_blank" ></a>
              <n-image :src="chat.uri+'?imageMogr2/format/webp'" style="border-radius: 3px;"  class="maxCss"  /> 
             <!-- :class="{'maxCss':!isMobile}" -->
            <!-- <div style="position: absolute;bottom: 10px;right: 20px;;"><n-button   type="primary"   size="small" ><a :href="chat?.uri+'?imageMogr2/format/webp'" target="_blank" style="color: #333;">查看</a></n-button></div> -->
          </div>
          <template v-if="chat?.mj_type!='U'">
            <div style="padding: 10px 0 0 0px;" >
            <!-- <n-button-group size="small"> -->
            
            <n-space>
              <template  v-for="a in st.fg">
              <n-tooltip trigger="hover">
               <template #trigger> 
               <n-button :type="isDo('U'+a)? 'error':'success'"  size="small" @click="imageSend( {t:'U',v:a,chat})" v-if="checkBt(`u`+a )">U{{ a }}</n-button>
                </template>高清单张：可局部重绘、变焦、强(弱)变化和各种视角
              
              </n-tooltip>
              </template>
              </n-space>
          <!--  </n-button-group> -->
            </div>
            <div style="padding: 10px 0 0 0px;  ">
            
              <n-space >
              <template   v-for="a in st.big" >
                <n-button :type="isDo('V'+a)? 'error':'info'"  size="small" @click="imageSend({t:'V',v:a,chat})"  v-if="checkBt(`v`+a )"> V{{ a }} 
                </n-button>
             </template>
              <!-- -->
              <n-button :type="isDo('V10')? 'error':'info'"  size="small"   @click="imageSend({t:'V',v: 10,chat})"   v-if="checkBt(`v10` )"> <SvgIcon icon="ci:arrows-reload-01"/> 重绘</n-button>
            
            </n-space>
            </div>
          </template>
          <template v-else >
            <n-space style="margin-top: 10px;">
               <n-button  :type="isDo('V21')? 'error':'warning'"  size="small"  @click="imageSend({t:'V',v: 21,chat})"  v-if="checkBt(`v21` )"><SvgIcon icon="fa-solid:magic"/> 强变化</n-button>
               <n-button  :type="isDo('V22')? 'error':'warning'"  size="small"  @click="imageSend({t:'V',v: 22,chat})"  v-if="checkBt(`v22` )"><SvgIcon icon="fa:magic"/> 弱变化</n-button>
                  <!-- @click="imageSend({t:'V',v: 23,chat})"  -->
               <n-button  :type="isDo('V23')? 'error':'warning'"  size="small"  @click="goCanvan()" v-if="checkBt(`v23` )"><SvgIcon icon="el:magic"/> 局部重绘</n-button>
            </n-space>
             <n-space style="margin-top: 10px;">
               <n-button :type="isDo('V31')? 'error':'info'"  size="small"  @click="imageSend({t:'V',v: 31,chat})"  v-if="checkBt(`v31` )"><SvgIcon icon="cil:search"/> 2倍变焦</n-button>
               <n-button :type="isDo('V32')? 'error':'info'"  size="small"  @click="imageSend({t:'V',v: 32,chat})"  v-if="checkBt(`v32` )"><SvgIcon icon="cil:search"/> 1.5倍变焦</n-button>
               <n-button :type="isDo('V34')? 'error':'info'"  size="small"  @click="imageSend({t:'V',v: 34,chat})"  v-if="checkBt(`v34` )"><SvgIcon icon="icons8:resize-four-directions"/> 方正拓展</n-button>
             </n-space>
              <n-space style="margin-top: 10px;">
               <n-button :type="isDo('V41')? 'error':'success'"  size="small"  @click="imageSend({t:'V',v: 41,chat})"  v-if="checkBt(`v41` )"><SvgIcon icon="icon-park-outline:left-two"/> 视角左移</n-button>
               <n-button :type="isDo('V42')? 'error':'success'"  size="small"  @click="imageSend({t:'V',v: 42,chat})"  v-if="checkBt(`v42` )"><SvgIcon icon="icon-park-outline:right-two"/> 视角右移</n-button>
               <n-button :type="isDo('V43')? 'error':'success'"  size="small"  @click="imageSend({t:'V',v: 43,chat})"  v-if="checkBt(`v43` )"><SvgIcon icon="icon-park-outline:up-two"/> 视角上移</n-button>
               <n-button :type="isDo('V44')? 'error':'success'"  size="small"  @click="imageSend({t:'V',v: 44,chat})"  v-if="checkBt(`v44` )"><SvgIcon icon="icon-park-outline:down-two"/> 视角下移</n-button>
             </n-space>

          </template>
        </div>
        <template v-else> 
          <template  v-if="!asRawText" >
            <div v-if="!loading" class="w-full markdown-body" >
              <div v-if="props.text=='-100'">
                发生错误！请重新生成！
                <div v-if="chat?.error_des" style="margin-top: 10px;" >错误信息：{{chat?.error_des}}</div>
              </div>
              <div v-else style=" padding: 20px; text-align: center;width: 200px;">
                <div style="width: 100%; margin-bottom: 20px;">未存储图片，请重新获取</div>
                <div style="width: 100%;"><n-button type="warning"  @click="emits('imageSend', {t:'reload',chat})">重新获取图片</n-button></div>
              </div>
            </div>
            
            <div class="w-full markdown-body" v-else >
               <n-image :src="chat?.uri_tem+'?imageMogr2/format/webp'" class="maxCss" style="border-radius: 3px;" v-if="chat?.uri_tem" /> 
               <span v-html="text"></span>
            </div>
          </template>
          <div v-else class="w-full whitespace-pre-wrap" v-text="text" />
         
         
        </template>

        <span v-if="loading" class="dark:text-white w-[4px] h-[20px] block animate-blink" />
      </div>
      <div v-else class="whitespace-pre-wrap" v-text="text" />
      <div v-if="st.uri_base64 &&  inversion" style="margin-top: 10px;">
        <n-image :src="st.uri_base64" style="border-radius: 3px;" class="maxCss" /> 
        <!-- :class="{'maxCss':!isMobile}"  -->
      </div>
    </div>
  </div>

  <NModal v-model:show="st.isShow"   preset="card"  title="局部重绘编辑" style="max-width: 800px;" @close="st.isShow=false" >
		   <aiCanvas :chat="chat" :base64="st.uri_base64" v-if="st.isShow" @success="maskOk" />
	</NModal>
</template>

<style lang="less">
@import url(./style.less);
.markdown-body img.maxCss,img.maxCss, .n-image img{ max-width: 400px!important; max-height: 400px!important;}
.mmWidth{ max-width: 600px;}
</style>
