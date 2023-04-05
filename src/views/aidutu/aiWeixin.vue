<template>
	<ai-msg ref="msgRef"></ai-msg>
	<div style="text-align: center;justify-content: center;padding-top: 20px;display: flex; align-items: center;flex-wrap: wrap" >
		<div>
			<img src="https://www.aidutu.cn/res/aidutu/wx.jpg" style="width: 200px;height: 200px;display: inline-block"  >
			<div style="color: #cccccc"  @click="copy">

			防走失，请扫码进群
			</div>
		</div>



	</div>
</template>

<script setup lang='ts'>
import AiMsg from "@/views/aidutu/aiMsg.vue";
import {ref} from "vue";
import {copyText3} from "@/utils/format";
const msgRef = ref();
const wxHao =ref('aidutu100')

function copy(){
	//console.log('复制',childRef,childRef.value.count  );
	//copyText({ text: props.text ?? '' })
	copyText3(  "aidutu100" ).then(()=>msgRef.value.showMsg('微信号复制成功！'));

}
</script>

<style scoped>

</style>
