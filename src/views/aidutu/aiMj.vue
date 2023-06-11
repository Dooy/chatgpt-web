<script   setup lang='ts'>
import { NDivider ,NInput,NButton,NTabs,NTabPane} from 'naive-ui'
import {  ref , computed} from 'vue'
import {  SvgIcon } from '@/components/common'
import AiMsg from '@/views/aidutu/aiMsg.vue' 
import { ajax, myTranslate } from '@/api' 

const st= ref({
    size:[
    {t:'1:1 头像图', v:'--ar 1:1', img:'https://static.aitutu.cc/res/img/m1-1.png'}
    ,{t:'1:2 手机壁纸', v:'--ar 1:2', img:'https://static.aitutu.cc/res/img/m2-1.png'}
    ,{t:'4:3 媒体配图', v:'--ar 4:3', img :'https://static.aitutu.cc/res/img/m4-3.png'}
    ,{t:'3:4 媒体配图', v:'--ar 3:4',img:'https://static.aitutu.cc/res/img/m3-4.png'}
    ,{t:'16:9 电脑壁纸', v:'--ar 16:9',img:'https://static.aitutu.cc/res/img/m16-9.png'}
    ,{t:'9:16 海报', v:'--ar 9:16',img:'https://static.aitutu.cc/res/img/m9-16.png'}
    ],
    skey:-1
    ,style:[
    {t:'赛博朋克',v:'cyberpunk'}
    , {t:'水墨',v:'Ink Wash Painting Style'}
    , {t:'星际',v:'Warframe'}
    , {t:'手绘素描',v:'Hand drawn sketches style '}
    , {t:'日本漫画',v:' Japanese comics/manga '}
    , {t:'山水画',v:' Tradition Chinese Ink Painting '}
    , {t:'二次元',v:'ACGN'}
    ]
    ,styleKey:-1
    ,text:'漂亮女孩头像'
    ,isLoad:false
})
const msgRef = ref()
const $emit=defineEmits(['drawSent','close']);
const props = defineProps({buttonDisabled:Boolean});

function create( ){
   
    const ps = createPrompt(st.value.text.trim());
    const rz={ prompt: ps, drawText: ps }
    if( rz.prompt  ) $emit('drawSent', rz )
}
function createPrompt(rz:string){
    if( rz =='') {
        msgRef.value.showError('请填写提示词！');
        return '';
    }
    //let rz=  st.value.text.trim() 
    if( st.value.styleKey>=0  && st.value.style[ st.value.styleKey])   rz+=','+st.value.style[ st.value.styleKey].v;
    if( st.value.size[ st.value.skey ] ) rz +=' '+st.value.size[ st.value.skey ].v ;
    //console.log('rz ', rz );
    console.log('rz',rz );
    return rz ;
}

async function train(){
     //msgRef.value.showMsg('开发中。。。');
    if( st.value.text.trim()  =='') {
        msgRef.value.showError('请填写提示词！');
        return '';
    }
    st.value.isLoad=true;
    //let d :any;
    let abd='';
    try {
        const d:any = await myTranslate(  st.value.text.trim()  );
        //str = str.replace(/[?.!]+$/, "");
       
        st.value.isLoad=false;
        abd=  d.content.replace(/[?.!]+$/, "")
        console.log('abd>>', abd )
    } catch (error) {
        msgRef.value.showMsg('翻译发生错误！');
        st.value.isLoad=false;
        return ;
    }

    const ps = createPrompt( abd );
    const rz={ prompt:  st.value.text.trim() , drawText: ps }
    if( rz.prompt  ) $emit('drawSent', rz )
   
   
}

const isDisabled = computed(() => {
    return props.buttonDisabled || st.value.isLoad || st.value.text.trim()==''
})
 
function loadConfig(){
  ajax({  url: '/chatgpt/mj/config' })
  .then((d) => {
    st.value.style= d.data.style
  } )
}
loadConfig();
    
</script>
<template>
<AiMsg ref="msgRef" />
<div> 
  <!-- <n-form  ref="formRef"    :label-width="180"     size="small" >
  </n-form> -->
   <n-divider title-placement="left" style="cursor: pointer;" @click="$emit('close')">
   绘画描述
   <!-- -收起 <span><SvgIcon icon="fluent-mdl2:drill-expand" /></span> -->
   </n-divider>
   <n-input    type="textarea"  v-model:value="st.text"   placeholder="请输入生成图片的提示词" round clearable maxlength="500" show-count 
      :autosize="{   minRows:3 }" />

    <n-tabs  type="line" size="small">
      
      <n-tab-pane name="the beatles" tab="画面比例">
        <div class="msize">
            <div class="mitem" v-for="(v,k) in  st.size" :key="k" :class="{select:k==st.skey}" @click="st.skey=k">
            <img :src="v.img" class="mimg"/> <span v-html="v.t"></span>
            </div>
        </div>
      </n-tab-pane>
      <n-tab-pane name="oasis" tab="绘画风格">
        <div class="msize">
            <div class="mitem m2" v-for="(v,k) in  st.style" :key="k" :class="{select:k==st.styleKey}" @click="st.styleKey=k">
            <span v-html="v.t"></span>
            </div>
        </div>
      </n-tab-pane>

      </n-tabs> 
    
    <div style="display: flex;">
        <div style="flex: 1; padding:  10px ;">
        <n-button type="primary" :block="true" :disabled="isDisabled"  @click="train()">
        <SvgIcon icon="ri:translate" /> 
        <template v-if="st.isLoad">翻译中...</template>
        <template v-else>翻译后生成图片</template>
        
        </n-button>
        </div>
        <div style=" padding: 10px;">
         <n-button type="primary" :block="true" :disabled="isDisabled"  @click="create()"><SvgIcon icon="mingcute:send-plane-fill" /> 直接生成图片</n-button>
        </div>
    </div>

</div>
</template>
<style scoped>
    .msize{
        display: flex;
        justify-content: left;
        flex-wrap: wrap;
    }
    .mitem{ 
        width:110px; align-items: center; height: 40px;
        border: 1px solid rgba(255, 255, 255, 0.09);
        margin-right: 10px;
        padding-left: 5px;
        display: flex;
        cursor: pointer;
        border-radius: 2px;
        margin-bottom: 10px;
        font-size: 12px;
    }
    .mitem.select{
        border: 1px solid #f0a020;
        color: #f0a020;
    }
    .mitem.m2{justify-content: center; }
    .mimg{ width :24px ; margin-left: 2px;}
</style>