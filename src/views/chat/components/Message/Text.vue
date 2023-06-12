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
import { NButtonGroup ,NButton, NSpace } from "naive-ui"

interface Props {
  inversion?: boolean
  error?: boolean
  text?: string
  loading?: boolean
  asRawText?: boolean
  chat?:Chat.Chat
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

const st = ref( {fg:[1,2,3,4],big:[1,2,3,4] ,isLoadImg:true})
const emits = defineEmits(['imageSend'  ])

function loadImage(){
  //chat.uri+'?imageMogr2/format/webp'
  if( props.chat?.uri){
    const img = new Image();
    img.onload=()=>{
      st.value.isLoadImg=false;
      emits('imageSend', {t:'loadImage',chat :props.chat})
    }
    img.src =  props.chat.uri+'?imageMogr2/format/webp';
  }else{
    // st.value.isLoadImg=false;
  }
}
loadImage()


//const chatUri = computed(() =>  props.chat?.uri );
watch(() =>  props.text, (newValue, oldValue) => {
      //console.log('props updated!', newValue, oldValue)
      loadImage()
      emits('imageSend', {t:'loadImage',chat :props.chat})
},{ deep: true})
</script>

<template>
	<ai-msg ref="childRef"></ai-msg>
  <div class="text-black" :class="wrapClass">
    <div ref="textRef" class="leading-relaxed break-words" :class="{'mmWidth':!isMobile}">
      <div v-if="!inversion" class="flex items-end">
        <div v-if="chat?.uri" class="w-full markdown-body"  >
          <div v-text="props.text"></div>
          <div v-if="st.isLoadImg" style="text-align: center; padding: 60px 20px;">
            <div  @click="loadImage">正在载入图片...</div> 
            <div  style="margin-top: 10px;text-align: center;"><n-button   type="primary"   size="small" ><a :href="chat?.uri+'?imageMogr2/format/webp'" target="_blank" style="color: #333;">查看原图</a></n-button></div> 
          </div>
          <div style="position: relative; margin-top: 15px; " v-else>
            <a :href="chat?.uri+'?imageMogr2/format/webp'" target="_blank" >
              <img :src="chat.uri+'?imageMogr2/format/webp'" :class="{'maxCss':!isMobile}" style="border-radius: 3px;"> 
            </a>
            <!-- <div style="position: absolute;bottom: 10px;right: 20px;;"><n-button   type="primary"   size="small" ><a :href="chat?.uri+'?imageMogr2/format/webp'" target="_blank" style="color: #333;">查看</a></n-button></div> -->
          </div>
          <template v-if="chat?.mj_type!='U'">
            <div style="padding: 10px 0 0 0px;" >
            <!-- <n-button-group size="small"> -->
            
            <n-space>扩大：
              <n-button type="success"  size="small" v-for="a in st.fg" @click="emits('imageSend',{t:'U',v:a,chat})">U{{ a }}</n-button>
              </n-space>
          <!--  </n-button-group> -->
            </div>
            <div style="padding: 10px 0 0 0px;">
            
              <n-space>风格：
              <n-button type="info"  size="small" v-for="a in st.big" @click="emits('imageSend',{t:'V',v:a,chat})" > V{{ a }} 
              </n-button>
            
            </n-space>
            </div>
          </template>
        </div>
        <template v-else> 
          <template  v-if="!asRawText" >
            <div v-if="!loading" class="w-full markdown-body" >
              <div v-if="props.text=='-100'">
                发生错误！请重新生成！
              </div>
              <div v-else style=" padding: 20px; text-align: center;width: 200px;">
                <div style="width: 100%; margin-bottom: 20px;">未存储图片，请重新获取</div>
                <div style="width: 100%;"><n-button type="warning"  @click="emits('imageSend', {t:'reload',chat})">重新获取图片</n-button></div>
              </div>
            </div>
            <div class="w-full markdown-body" v-html="guolv(text)" v-else />
          </template>
          <div v-else class="w-full whitespace-pre-wrap" v-text="text" />
        </template>

        <span v-if="loading" class="dark:text-white w-[4px] h-[20px] block animate-blink" />
      </div>
      <div v-else class="whitespace-pre-wrap" v-text="text" />
    </div>
  </div>
</template>

<style lang="less">
@import url(./style.less);
.markdown-body img.maxCss{ max-width: 400px;}
.mmWidth{ max-width: 600px;}
</style>
