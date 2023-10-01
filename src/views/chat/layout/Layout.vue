<script setup lang='ts'>
import { computed } from 'vue'
import { NLayout, NLayoutContent,NLayoutFooter } from 'naive-ui'
import { useRouter } from 'vue-router'
import Sider from './sider/index.vue'
import Permission from './Permission.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useChatStore } from '@/store'
import aiSider from '@/views/aidutu/aiSider.vue';
import aiMobileMenu from '@/views/aidutu/aiMobileMenu.vue'; 
import AiGallery from '@/views/aidutu/aiGallery.vue';

const router = useRouter()
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()

router.replace({ name: 'Chat', params: { uuid: chatStore.active } })

const { isMobile } = useBasicLayout()

const collapsed = computed(() => appStore.siderCollapsed)

const needPermission = computed(() => !!authStore.session?.auth && !authStore.token)

const getMobileClass = computed(() => {
  if (isMobile.value)
    return ['rounded-none', 'shadow-none']
  return [  'shadow-md', 'dark:border-neutral-800'] //'border','rounded-md',
})

const getContainerClass = computed(() => {
  return [
    'h-full',
    { 'abc': !isMobile.value && !collapsed.value }, //pl-[260px]'
  ]
})
</script>

<template>

<!-- <div class="h-full overflow-hidden"   :class="getMobileClass"  v-if="isMobile">
         
            <NLayout class="z-40 transition w-full h-full relative" >
              
              
              <NLayoutContent  position="absolute"  style="top: 0px; bottom: 64px" class="w-full z-[-1]">
                <RouterView v-slot="{ Component, route }">
                  <component :is="Component" :key="route.fullPath" />
                </RouterView>
              </NLayoutContent>  
               <NLayoutFooter  position="absolute" style="bottom: 0px">good news</NLayoutFooter>
            </NLayout>
       

      </div> -->
 
  
  <div class=" dark:bg-[#24272e] transition-all " :class="[isMobile ? 'mobile flex-1' : 'h-full ']"  >
     
      
      
      <div class="h-full overflow-hidden" :class="getMobileClass" >
        <NLayout class="z-40 transition" :class="getContainerClass" has-sider :sider-placement="isMobile?'left': 'right'">
          
          <!-- 这个左侧栏目 -->
          <aiSider v-if="!isMobile"/>
         
          <NLayoutContent class="h-full">
            <RouterView v-slot="{ Component, route }">
              <component :is="Component" :key="route.fullPath" />
            </RouterView>
          </NLayoutContent> 
          <Sider  />
          <!-- <aiSiderInput v-if="!isMobile"/>  -->
        </NLayout>
      </div>

      <Permission :visible="needPermission" />
   
  </div> 
  <aiMobileMenu v-if="isMobile" /> 
  <AiGallery />
  
</template>
<style>
.abc{
  padding-left: 0px;}
.mobile{
  height: calc(100% - 55px);
}
</style>