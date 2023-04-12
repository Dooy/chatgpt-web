<template>
	<ai-msg ref="msgRef"></ai-msg>

	<div style="max-width: 600px; margin: 0 auto; padding: 10px" v-html="wxConfig.msg">

	</div>

	<div style="text-align: center;justify-content: center;padding-top: 20px;display: flex; align-items: center;flex-wrap: wrap" >
		<div>
			<img :src="wxConfig.img" style="width: 200px;height: 200px;display: inline-block"  >
			<div style="color: #cccccc"  @click="copy" v-html="wxConfig.ts">

			</div>
		</div>



	</div>
</template>

<script setup lang='ts'>
import AiMsg from "@/views/aidutu/aiMsg.vue";
import {onMounted, ref} from "vue";
import {copyText3} from "@/utils/format";
import {ajax} from "@/api";
const msgRef = ref();
const wxHao =ref('aidutu100')
const wxConfig= ref({img:'https://cdn.aidutu.cn/res/aidutu/wx.jpg',ts:'防走失，请扫描进群'
	,msg:'本网站旨在辅助用户更高效的工作和学习，为了保障您的人个权益，请勿在此输入个人隐私或各种机密信息；诱导生成、传播国家法律禁止的涉及政治、色情、谣言等相关内容，使用本网站提供的本服务，视为您接受并同意《免责声明》全部内容。'});

function copy(){
	//console.log('复制',childRef,childRef.value.count  );
	//copyText({ text: props.text ?? '' })
	copyText3(  "aidutu100" ).then(()=>msgRef.value.showMsg('微信号复制成功！'));

}
const loadConfig = () => {
	ajax({url:'/chatgpt/config/init'}).then(d=> wxConfig.value=d.data.cf );
}
onMounted( loadConfig )
</script>

<style scoped>

</style>
