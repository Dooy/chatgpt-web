<script  setup lang='ts'>
import { ref ,computed } from 'vue'
import { NButton, NModal, NRadioButton, NRadioGroup,useDialog ,NInputNumber  } from 'naive-ui'
import { useUserStore } from '@/store'
import  AiMsg  from '@/views/aidutu/aiMsg.vue'
import {SvgIcon}  from '@/components/common'
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

import { useUsingContext } from '../chat/hooks/useUsingContext'
const { usingContext, toggleUsingContext } = useUsingContext()
const usC=  computed(() => usingContext)  ;//usingContext.value;

const st = ref({ show: false })
const fm = ref({ tokens: userInfo.value.tokens?  parseInt(userInfo.value.tokens):1000, model: userInfo.value.model??'GPT3.5',usingContext:usC.value })
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
  userStore.updateUserInfo({ tokens: fm.value.tokens.toString(), model: fm.value.model })
  msgRef.value.showMsg('保存成功')
  st.value.show = false
  userStore.updateUserInfo({ doLogin: 4 })
}

function cg2( ){
  if(fm.value.model=='GPT4.0' && fm.value.usingContext){
    toggleUsingContext()
  }
}

 
const getIcon=  computed(() => {
    if( userInfo.value.modelConfig){
      const index= userInfo.value.modelConfig.findIndex(v=>v.key==userInfo.value.model )
      if(index>-1   ) return  userInfo.value.modelConfig[index];
    }
    return {name:'GPT3.5',key:'GPT3.5',icon:'simple-icons:openaigym'}
}) 
//console.log('userInfo', userInfo.value )
</script>

<template>
  <AiMsg ref="msgRef" />
  <div style="color: #cccccc">
    当前模型：{{ getIcon.name }} ,上下文:{{ (usingContext?'连续':'断开') }}   
    <span style="color: #1f6feb;cursor: pointer" @click="st.show = !st.show">点这里切换<a v-if="userInfo.model!='GPT4.0'">4.0</a></span>
  </div>
  <NModal v-model:show="st.show" :auto-focus="false" preset="card" title="模型切换" style="width: 95%; max-width: 540px">
    <div class="space-y-6">
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">模型</span>
        <div class="w-[200px]">
          <NRadioGroup v-model:value="fm.model" name="radiogroup2"  @change="cg2">
          <NRadioButton :value="v2.key" v-for="(v2 ,k2) of  userInfo.modelConfig" :key="k2" >
                  <div style="display: flex; align-items: center; justify-content: center;">  <span style="margin-left: 5px;"><SvgIcon :icon="v2.icon" /></span> {{ v2.name }}</div>
          </NRadioButton>
           <!-- <NRadioButton value="baidu">
              百度文心
            </NRadioButton>
            <NRadioButton value="GPT3.5">
              GPT3.5
            </NRadioButton>
            <NRadioButton value="GPT4.0">
              GPT4.0
            </NRadioButton>  -->

          </NRadioGroup>
        </div>
         
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">答案最大tokens</span>
        <div class="w-[100px]">
          <!-- <NInput v-model:value="fm.tokens" placeholder="最大tokens" :disabled="fm.model === 'GPT3.5'" /> -->
          <NInputNumber v-model:value="fm.tokens" placeholder="最大tokens" :min="50" :step="50" :max="8192"  :disabled="fm.model === 'GPT3.5'" />
        </div>
        <div class="w-[100px]" style="color: #cccccc; font-size: 12px;;">
          仅支持4.0<br>最大8k即8192
        </div>
      </div>
      
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">上下文</span>
        <div class="w-[100px]">
          <NRadioGroup v-model:value="fm.usingContext" name="radiogroup3" @change="toggleUsingContext">
            <NRadioButton :value="true">
              连续
            </NRadioButton>
            <NRadioButton :value="false">
              断开
            </NRadioButton>
          </NRadioGroup>
        </div>
         <div class="w-[200px]" style="color: #cccccc; font-size: 12px;;">
         上下文连续会消耗大量的Token
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
