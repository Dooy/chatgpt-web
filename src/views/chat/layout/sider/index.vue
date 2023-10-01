<script setup lang='ts'>
import type { CSSProperties } from 'vue'
import {computed, onMounted, ref, watch} from 'vue'
import { NButton, NLayoutSider,NModal } from 'naive-ui'
import List from './List.vue'
import Footer from './Footer.vue'
import {useAppStore, useChatStore, useUserStore} from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { PromptStore } from '@/components/common'
import AiDasan from "@/views/aidutu/aiDasan.vue";
import {useRoute} from "vue-router";

const appStore = useAppStore()
const chatStore = useChatStore()

const { isMobile,isMD } = useBasicLayout()
const show = ref(false)
const show2 = ref(false)

const collapsed = computed(() => appStore.siderCollapsed ||  isMD.value)

function handleAdd() {
  chatStore.addHistory({ title: 'New Task', uuid: Date.now(), isEdit: false })
  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

function handleUpdateCollapsed() {
  appStore.setSiderCollapsed(!collapsed.value)
}

const getMobileClass = computed<CSSProperties>(() => {
  if (isMobile.value) {
    return {
      position: 'fixed',
      zIndex: 50,
    }
  }
  return {}
})

const mobileSafeArea = computed(() => {
  if (isMobile.value) {
    return {
      paddingBottom: 'env(safe-area-inset-bottom)',
    }
  }
  return {}
})

watch(
  isMobile,
  (val) => {
    appStore.setSiderCollapsed(val)
  },
  {
    immediate: true,
    flush: 'post',
  },
)

const goCz=()=>{
	userStore.updateUserInfo({doLogin:1})
}

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const route = useRoute()
const { uuid } = route.params as { uuid: string }
const dataSources = computed(() => chatStore.getChatByUuid(+uuid))
onMounted(()=>{
	const len= dataSources.value.length;
	if(len>5) handleAdd() //进来先新建主题
})

</script>

<template>
<!-- position="absolute" -->
  <NLayoutSider
    :collapsed="collapsed"
    :collapsed-width="0"
    :width="260"
    :show-trigger="isMobile ? false : 'arrow-circle'"
    collapse-mode="transform"
   
    bordered
    :style="getMobileClass"
    @update-collapsed="handleUpdateCollapsed"
  >
    <div class="flex flex-col h-full" :style="mobileSafeArea">
      <main class="flex flex-col flex-1 min-h-0">
        <div class="p-4">
          <NButton dashed block @click="handleAdd">
            {{ $t('chat.newChatButton') }}
          </NButton>
        </div>
        <div class="flex-1 min-h-0 pb-4 overflow-hidden">
          <List />
        </div>
        <div class="p-4">
          <NButton block @click="show = true" v-if="show">
            {{ $t('store.siderButton') }}
          </NButton>

					<NButton block @click="goCz()" type="warning" v-if="userInfo.isVip">
						 充值续费
					</NButton>
					<NButton block @click="show2 = true" type="warning" v-else>
						求赞赏
					</NButton>
					<!-- <div style="text-align: center;padding-top: 10px"> <a href="https://docs.qq.com/doc/DWHFYamFkV1RPTkxi" target="_blank" style="color: #1f6feb">免责申明</a> </div> -->
        </div>
      </main>
      <!-- <Footer /> -->
    </div>
  </NLayoutSider>
  <template v-if="isMobile">
    <div v-show="!collapsed" class="fixed inset-0 z-40 bg-black/40" @click="handleUpdateCollapsed" />
  </template>
  <PromptStore v-model:visible="show" />
	<NModal v-model:show="show2" style=" width: 450px;" preset="card" >
		<ai-dasan></ai-dasan>
	</NModal>
</template>
