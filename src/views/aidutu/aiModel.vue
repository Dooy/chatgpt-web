<script  setup lang='ts'>
import { ref ,computed } from 'vue'
import { NButton, NInput, NModal, NRadioButton, NRadioGroup,useDialog } from 'naive-ui'
import { useUserStore } from '@/store'
import  AiMsg  from '@/views/aidutu/aiMsg.vue'
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const st = ref({ show: false })
const fm = ref({ tokens: userInfo.value.tokens??'1000', model: userInfo.value.model??'GPT3.5' })
const msgRef= ref();
const dialog = useDialog()
function save(){
  //
  if(userInfo.value.model!='GPT4.0' && fm.value.model=='GPT4.0'){
     dialog.success({
       title: '再次确认',
       content: '您当前正在切换为GPT-4 会话模式，切换后将失去当前上下文，GPT-4将会消耗大量Token, 成本大概为GPT-3.5的15-30倍，且速度很慢，建议组织好问题后再使用。',
          positiveText: '切换',
          negativeText: '取消',
          maskClosable: false,
          onPositiveClick: () => {
            doSave()
          }
     })
    
  }else doSave()
}
function doSave(){
  userStore.updateUserInfo( fm.value)
  msgRef.value.showMsg('保存成功')
  st.value.show = false
  userStore.updateUserInfo({ doLogin: 4 })
}
//console.log('userInfo', userInfo.value )
</script>

<template>
  <AiMsg ref="msgRef" />
  <div style="color: #cccccc">
    当前使用的是：{{ userInfo.model??'GPT3.5' }}   <span style="color: #1f6feb;cursor: pointer" @click="st.show = !st.show">点这里切换</span>
  </div>
  <NModal v-model:show="st.show" :auto-focus="false" preset="card" title="模型切换" style="width: 95%; max-width: 540px">
    <div class="space-y-6">
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">模型</span>
        <div class="w-[200px]">
          <NRadioGroup v-model:value="fm.model" name="radiogroup2">
            <NRadioButton value="GPT3.5">
              GPT3.5
            </NRadioButton>
            <NRadioButton value="GPT4.0">
              GPT4.0
            </NRadioButton>
          </NRadioGroup>
        </div>
         
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">答案最大tokens</span>
        <div class="w-[100px]">
          <NInput v-model:value="fm.tokens" placeholder="最大tokens" :disabled="fm.model === 'GPT3.5'" />
        </div>
        <div class="w-[100px]" style="color: #cccccc; font-size: 12px;;">
          仅支持GPT4.0
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]" />
        <div class="w-[200px]">
          <NButton type="primary" @click="save">
            保存
          </NButton>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped>

</style>
