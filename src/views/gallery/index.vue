<script setup lang="ts">
import { LazyImg, Waterfall } from 'vue-waterfall-plugin-next'
import 'vue-waterfall-plugin-next/dist/style.css'
import { ajax } from '@/api' 
import {ref,nextTick} from "vue"
import {NSpin ,NButton,NImage ,NDialog} from 'naive-ui' 
import {copyText3} from "@/utils/format";
//import { copyText } from 'vue3-clipboard'
//import { copyToClip } from "@/utils/copy";
import AiMsg from "@/views/aidutu/aiMsg.vue";
import { homeStore } from "@/store"
import { useBasicLayout } from '@/hooks/useBasicLayout'
const { isMobile } = useBasicLayout()

const emit = defineEmits(['close']);
//import {hom}

const st =ref({show:true
,showImg:''
});

const showImg= ref<NImage>();
const msgRef = ref();

const list = ref([])

const breakpoints= {
  1200: { //当屏幕宽度小于等于1200
    rowPerView: 4,
  },
  800: { //当屏幕宽度小于等于800
    rowPerView: 3,
  },
  500: { //当屏幕宽度小于等于500
    rowPerView: 2,
  }
}

const loadImg= ( )=>{
    
    ajax({  url: '/chatgpt/mj/gallery' })
        .then((d) => {
            // st.value.style= d.data.style
            // st.value.example= d.data.example
            console.log(d)
            list.value= d.data.images.map((v:any)=>{ 
                v.isLoad=0
                return  v;
            })
        } )
}
const goShow=( item:any)=>{
    //console.log('goShow', isMobile );
    if( isMobile.value)   return ; 
    st.value.show= true;
    st.value.showImg= item.image_hd_url;
    //console.log('goShow', item);
    nextTick(() => showImg.value?.click());
}
function copy( item:any){ 
  //console.log('copy', item.prompt );
	//copyText3(  item.prompt ).then(()=>msgRef.value.showMsg('复制成功！'));
  homeStore.setMyData({act:'copy',actData: {text: item.prompt } });
	//copyToClip(  item.prompt ).then(()=>msgRef.value.showMsg('复制成功！'));
}

const copy2=(text:string)=>{
   copyText3(   text ).then(()=>msgRef.value.showMsg('复制成功2！'));
}

//画同款
const same=( item:any,act:string)=>{
  //console.log('same',item);
  homeStore.setMyData({act,actData: JSON.parse(JSON.stringify(item) ) }); //:'same'
  emit('close');
}
loadImg();

</script>
<template>
<ai-msg ref="msgRef"></ai-msg>
 <Waterfall :list="list" :breakpoints="breakpoints"  class=" !bg-transparent">
  <template #item="{ item, url, index }">
    <div class="bg-white dark:bg-[#24272e] rounded-md   overflow-hidden cursor-pointer group/item relative">
      <LazyImg :url="item.image_url"  @success="item.isLoad=1" @click="goShow(item )" />
      <!-- <LazyImg :url="item.image_hd_url"  @success="item.isLoad=1" /> -->
      <div class="absolute top-0 left-0 right-0 bottom-0" v-if="item.isLoad==0">
        <div class="flex justify-center items-center w-full h-full">
            <n-spin size="large" />
        </div>
      </div>
      <div class="absolute w-full bottom-0   backdrop-blur-sm text-white/70 invisible group-hover/item:visible ">
        <div class="p-3">
            <div class="line-clamp-2 text-[13px]">{{ item.prompt }}</div>
            <div class="space-x-2">
                
                <!-- <NButton type="primary" size="small" @click="copy(item )" >复制</NButton> -->
                <NButton type="primary" size="small" @click="same(item,'same2' )" >引用</NButton>
                <NButton type="primary" size="small"  @click="same(item,'same' )">画同款</NButton>
                 
            </div>
        </div>
      </div>
      <!-- <p class="text">这是具体内容</p> -->
    </div>
  </template>
</Waterfall>


<NImage   :src="st.showImg"  ref="showImg" v-if="st.showImg" :width="1" />
 <!-- <NButton type="primary" size="small" @click="copy2('abdd' )" >复制</NButton> -->

<!-- <div @click="copy2('abdd' )">复制测试</div> -->
</template>

<style>
.lazy__img[lazy=loading] {
  padding: 5em 0;
  width: 48px;
}

.lazy__img[lazy=loaded] {
  width: 100%;
}

.lazy__img[lazy=error] {
  padding: 5em 0;
  width: 48px;
}
</style>