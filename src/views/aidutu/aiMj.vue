<script   setup lang='ts'>
import { NDivider ,NInput,NButton,NTabs,NTabPane,NSpace,NTag,NModal,NPopover} from 'naive-ui'
import {  ref , computed} from 'vue'
import {  SvgIcon } from '@/components/common'
import AiMsg from '@/views/aidutu/aiMsg.vue' 
import { ajax, myTranslate } from '@/api' 
//import { saveImg } from './mj'

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
    ,example:[
        {n:'示例:icon包',e:'Vintage microphon Vector icon pack , 16 syle per pack ,hi-tech ,Minimal style, 3D minimal ,Them black --s 250 --v 5.1 --style raw',z:'复古micropon Vector图标包，每包16 syle，高科技，简约风格，3D简约，黑色'}
        ,{n:'示例:游戏图',e:'RPG game, pixel style, an island, a village, trees, lake, river. --s 750 --v 5 ',z:'RPG游戏，像素风格，一个岛，一个村庄，树木，湖泊，河流。'}
        //,{n:'示例:室内设计',e:'Any CAD design drawings',z:'任何CAD设计图纸'}
    ]
    ,styleKey:-1
    ,text:''
    ,isLoad:false
    ,show:false
    ,exampleKey:0
    ,fileBase64:""
})
const msgRef = ref()
const fsRef= ref()
const $emit=defineEmits(['drawSent','close']);
const props = defineProps({buttonDisabled:Boolean});

function containsChinese(str:string ) {
  var reg = /[\u4e00-\u9fa5]/g; // 匹配中文的正则表达式
  return reg.test(str);
}
function create( ){
   
    //const q= 
    if( containsChinese( st.value.text.trim()) ){
        train();
        return ;
    }
    const ps = createPrompt(st.value.text.trim());
    const rz={ prompt: ps, drawText: ps }
    if( rz.prompt  ) drawSent(rz)
    st.value.text=''
}
function drawSent(rz:any){
    let rz2= rz;
    if(st.value.fileBase64) {
        rz2.fileBase64=st.value.fileBase64
    }
    $emit('drawSent', rz2 )
    st.value.fileBase64='';
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
    if( rz.prompt  ) drawSent(rz)
    st.value.text=''
   
   
}

const isDisabled = computed(() => {
    return props.buttonDisabled || st.value.isLoad || st.value.text.trim()==''
})
 
function loadConfig(){
  ajax({  url: '/chatgpt/mj/config' })
  .then((d) => {
    st.value.style= d.data.style
    st.value.example= d.data.example
  } )
}
loadConfig();

function example(k:number){
    //console.log('example>> ', e );
    st.value.show = true;
    st.value.exampleKey=k ;
    //saveImg('test','god');
} 
function exampleGo( ){
    st.value.show = false;
    const obj= st.value.example[st.value.exampleKey]
    const rz={ prompt:  obj.z  , drawText: obj.e }
    $emit('drawSent', rz )
}
function selectFile(input:any){
    //console.log('selectFile',input.target.files )
    const file = input.target.files[0];
    const filename = file.name;
    //console.log('selectFile', file )
    if(file.size>(1024*1024)){
        msgRef.value.showError('图片大小不能超过1M');
        return ;
    }
    if (! (filename.endsWith('.jpg') ||
        filename.endsWith('.gif') ||
        filename.endsWith('.png') ||
        filename.endsWith('.jpeg') )) {
        msgRef.value.showError('图片仅支持jpg,gif,png,jpeg格式');
        return ;
    }
    const reader = new FileReader();
    // 当读取操作完成时触发该事件
    reader.onload = (e:any)=> st.value.fileBase64 = e.target.result;
    reader.readAsDataURL(file);
}
</script>
<template>
<AiMsg ref="msgRef" />
<input type="file"  @change="selectFile" ref="fsRef" style="display: none" accept="image/jpeg, image/jpg, image/png, image/gif"/>
<NModal v-model:show="st.show" :auto-focus="false" preset="card" :title="st.example[st.exampleKey].n" style="width: 95%; max-width: 540px">
    <div class="space-y-6">
        <div v-html="st.example[st.exampleKey].z"></div>
        <div  style="font-size: 12px;border-bottom: 1px solid #dddddd15;height: 2px;line-height: 0;padding: 0;margin: 10px 0 0 0;"></div>
        <div v-html="st.example[st.exampleKey].e" style="margin-top: 10px;"></div>
        <div style="text-align: right;;">
            <n-button type="primary"    @click="exampleGo()">示例会扣除一次额度，我很确定去绘图</n-button>
        </div>
    </div>
</NModal>
<div style="position: relative;;"> 
  <!-- <n-form  ref="formRef"    :label-width="180"     size="small" >
  </n-form> -->
   <n-divider title-placement="left" style="cursor: pointer;"  >
   <span class="gradient-text">绘画描述</span>
   <!-- -收起 <span><SvgIcon icon="fluent-mdl2:drill-expand" /></span> -->
   </n-divider>
   <div style="position: absolute; right: 0px; top:20px; z-index: 10;">
   <n-space>
    <NPopover trigger="hover">
      <template #trigger>
    <n-tag type="error" round size="small" style="cursor: pointer; " :bordered="false" @click="fsRef.click()"   v-if="st.fileBase64">
       <div style="display: flex;">  <SvgIcon icon="mdi:file-chart-check-outline" />含有垫图  </div>
    </n-tag>
     <n-tag type="warning" round size="small" style="cursor: pointer; " :bordered="false" @click="fsRef.click()"   v-else="st.fileBase64">
       <div style="display: flex;">  <SvgIcon icon="mdi:file-document-plus-outline" /> 自传垫图  </div>
    </n-tag>
    </template>
    <div  style="max-width: 240px;">垫图说明：<br/>
    1.垫图可使用自己的图片作为基础，让MJ来绘图<br/>
    2.垫图耗时长所以会扣除<b style="color: green;">2张</b>图片的额度，请谨慎使用
    <div v-if="st.fileBase64">
        <img style="width: 200px; cursor: pointer;" :src="st.fileBase64">
        <br/> 
        <NButton size="small" @click="st.fileBase64=''" type="warning" >删除</NButton>
    </div>
    </div>
    </NPopover>
    <n-tag type="success" round size="small" style="cursor: pointer;" :bordered="false" v-for="(v,k) in st.example" :key="k" v-text="v.n" @click="example(k )"></n-tag>
   </n-space>
   </div>
   <n-input    type="textarea"  v-model:value="st.text"   placeholder="提示词 推荐:【画面场景】+【镜头视角】+【风格参考】+【渲染方式】, 关键词之间用“,”隔开" round clearable maxlength="500" show-count 
      :autosize="{   minRows:3 }" />

    <div class=" flex justify-between items-center">
        <div style="margin: 7px 0;">
        <n-space>
            <NPopover trigger="hover">
                <template #trigger>
                    <n-tag type="warning" round size="small" style="cursor: pointer; " :bordered="false" >
                    <div style="display: flex;" v-if="st.skey>-1">  <SvgIcon icon="gg:style" />画面: {{ st.size[st.skey].t }}</div>
                    <div style="display: flex;" v-else>  <SvgIcon icon="gg:style" />请选择画面比例</div>
                    </n-tag>
                </template>
                <div class="msize" style="max-width: 240px;">
                    <div class="mitem" v-for="(v,k) in  st.size" :key="k" :class="{select:k==st.skey}" @click="st.skey=k">
                    <img :src="v.img" class="mimg"/> <span v-html="v.t"></span>
                    </div>
                    <div class="mitem m2"  @click="st.skey=-1"><SvgIcon icon="icon-park-outline:nuclear-plant" /> 清除</div>
                </div> 
            </NPopover>


            <NPopover trigger="hover">
                <template #trigger>
                    <n-tag type="warning" round size="small" style="cursor: pointer; " :bordered="false" >
                    <div style="display: flex;" v-if="st.styleKey>-1">  <SvgIcon icon="typcn:th-small-outline" />风格: {{ st.style[st.styleKey].t }}</div>
                    <div style="display: flex;" v-else>  <SvgIcon icon="typcn:th-small-outline" />请选择绘画风格</div>
                    </n-tag>
                </template>
                <div class="msize" style="max-width: 240px;">
                    <div class="mitem m2" v-for="(v,k) in  st.style" :key="k" :class="{select:k==st.styleKey}" @click="st.styleKey=k">
                    <span v-html="v.t"></span>
                    </div>
                    <div class="mitem m2"  @click="st.styleKey=-1"><SvgIcon icon="icon-park-outline:nuclear-plant" /> 清除</div>
                </div> 
            </NPopover>

        </n-space>
        </div>

    
        <div style="display: flex;">
            <!-- <div style=" padding: 10px;">
            <n-button type="primary" :block="true" :disabled="isDisabled"  @click="create()">
            <SvgIcon icon="ri:translate" /> 直接生成图片</n-button>
            </div> -->
            <div style="flex: 1;">
            <n-button type="primary" :block="true" :disabled="isDisabled"  @click="create()">
            <SvgIcon icon="mingcute:send-plane-fill" />  
            <template v-if="st.isLoad"> 翻译中...</template>
            <template v-else> 生成图片</template>
            
            </n-button>
            </div>
        
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
<style>
 body .gradient-text{
    background: rgba(0,0,0,0) linear-gradient(235deg, #ff4800 0%, #da54d8 51%, #0092f4 100%) 0% 0% no-repeat padding-box;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: rgba(0,0,0,0);

    }
</style>