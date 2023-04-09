<template>
	<div class="space-y-4" style="text-align: center">

		<div v-if="st.img==''">
			 Loading....
		</div>
		<template v-else>
		<img :src="st.img" style="width: 400px;height: 400px;display: inline-block" >
			<div style="color: #cccccc"  >
				<div style="color: #666;font-weight: 600;font-size: 18px">求打赏</div>
				<div v-html="st.msg"></div>

			</div>
		</template>
	</div>
</template>
<script lang="ts" setup>
import {onMounted, ref} from "vue";
import {ajax} from "@/api";
const st=ref({img:'',msg:''});
onMounted(()=>{
	ajax({url:'/chatgpt/config/zan'}).then(d=> st.value=d.data.cf).catch(()=>{
		 st.value.img='https://cdn.aidutu.cn/res/aidutu/wxsan.jpg?d=ds';
	})
})
</script>
