<script setup lang="ts">
import { SvgIcon } from '@/components/common';
import { useUserStore,homeStore } from '@/store'
const userStore = useUserStore()
const goCz=()=>{
   //console.log('gz');
	userStore.updateUserInfo({doLogin:1})
}

</script>
<template>
  <div class=" bg-gray-100 dark:bg-[#282832] h-[55px] flex  justify-around  items-center dark:text-white/70 " >
      <div class="flex items-center justify-center flex-col " @click="homeStore.setMyData({act:'gallery'})">
        <SvgIcon icon="mingcute:grid-2-line" class="text-3xl"></SvgIcon>
        <div class="text-[13px]">画廊</div>
      </div>
      <div class="flex items-center justify-center flex-col active" >
        <SvgIcon icon="ic:outline-palette" class="text-3xl"></SvgIcon>
        <div class="text-[13px]">绘画</div>
      </div>
      <div class="flex items-center justify-center flex-col " @click="homeStore.setMyData({act:'newtask'})" >
        <SvgIcon icon="gg:add" class="text-3xl"></SvgIcon>
        <div class="text-[13px]">新建绘画</div>
      </div>
      <div class="flex items-center justify-center flex-col" @click="goCz">
        <SvgIcon icon="fxemoji:gem" class="text-3xl"></SvgIcon>
        <div class="text-[13px]">充值</div>
      </div>
       
  </div>
</template>