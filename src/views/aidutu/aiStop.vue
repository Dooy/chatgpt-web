<script setup lang="ts">
import { NModal } from 'naive-ui'
import { onMounted, ref } from 'vue'
import { ajax } from '../../api'
import { isIfram } from '../../utils/functions'
import { useUserStore } from '@/store' 
const userStore = useUserStore()
//const userInfo = computed(() => userStore.userInfo)

const st = ref({msg:'公共<span style="color:Red">内容</span>',is:false,title:'',isStop:false,isCz:true})
onMounted(() => {
   let data = {isf:2}
   data.isf= isIfram()?1:2 ;
   ajax({url:'/chatgpt/stop/info',method:'POST',data })
   .then(d=>{
   //console.log('stop', d.data.stop  )
   st.value = d.data.stop
   userStore.updateUserInfo({isStop: st.value.isStop,isCz:st.value.isCz})
 } )
})
</script>

<template>
<NModal v-model:show="st.is" :auto-focus="false" preset="card" :title="st.title" style="width: 95%; max-width:640px" >
    <div class="space-y-6">
      <div v-html="st.msg"></div>
    </div>
</NModal>
</template>