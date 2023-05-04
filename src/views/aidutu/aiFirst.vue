<template>



	<div v-if="userInfo.isVip">

		<template v-if="showCard">
		<div v-if="rqList.length" class="myTitle">
			<n-card :title="v2.title" size="small" class="mycard"  v-for="v2 in rqList" @click="go(v2)">{{v2.v}}</n-card>
		</div>
		</template>
		<ai-weixin></ai-weixin>
		<div class="  mt-4 text-center">
			<template v-if="!stvip.msg">
				Loading...
			</template>
			<template v-else>
				<div>
				<n-button @click="openVip()"    type="info" v-html="stvip.bt" ></n-button>
				</div>
				<div v-html="stvip.msg"  style="padding-top: 10px;"></div>
			</template>
		</div>
	</div>
	<template v-else>
		<template v-if="showCard">
			<div class="flex items-center justify-center mt-4 text-center text-neutral-300">
				<SvgIcon icon="ri:bubble-chart-fill" class="mr-2 text-3xl" />
				<span v-if="isMobile">你可以点击下面的例子，体验我的能力<br/>当然，这只是冰山一角</span>
				<span v-else>你可以点击下面的例子，体验我的能力，当然，这只是冰山一角</span>

			</div>
			<div v-if="rqList.length" class="myTitle">
				<n-card :title="v2.title" size="small" class="mycard"  v-for="v2 in rqList" @click="go(v2)">{{v2.v}}</n-card>
			</div>
		</template>

		<ai-weixin></ai-weixin>
	</template>

	<NModal v-model:show="isOpenVip" style=" width: 550px;" preset="card" title="会员充值续费"  :on-after-enter="vipClose">
		<ai-open-vip   v-if="isOpenVip" @success="loadVip"></ai-open-vip>
	</NModal>

</template>

<script  lang='ts' setup>
//默认问题
import {computed, onMounted, reactive, ref, watch} from "vue";
import {useBasicLayout} from "@/hooks/useBasicLayout";
import AiWeixin from "@/views/aidutu/aiWeixin.vue";
import {  SvgIcon } from '@/components/common'
import { NCard,NButton,NModal } from 'naive-ui'
import {useUserStore} from "@/store";
import {ajax} from "@/api";
import AiOpenVip from "@/views/aidutu/aiOpenVip.vue";

const emits = defineEmits(['go', 'openVip'])
const { isMobile } = useBasicLayout()
let arr=[];
arr.push({title:'商品文案', v:"销售电饭锅，请生成商品标题、描述、客户好评"});
arr.push({title:'快速编程',v:'请用Python基于flask实现chatgpt的服务器端'})
if( !isMobile.value ) arr.push({title:'广告文案',v:'我是卖炸鸡的，请模拟顾客给我写5条好评'})
arr.push({title:'文学创作',v:'我正在写一篇小说，关于爱情的题材，请帮我构思一下主要情节和人物设定'})
arr.push({title:'社交推广',v:'请创作一条微博内容，以吸引年轻用户对你的服装品牌产生兴趣'})
if( !isMobile.value ) arr.push({title:'故事现编',v:'写一篇童话故事，讲述一只勇敢的小兔子如何打败了恶龙'})
const myArray= reactive(arr);
const rqList= ref(myArray)
const go = (v:any)=>emits('go',v)
const showCard=ref(false)

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const stvip= ref({msg:'',bt:'',isVip:0});
const isOpenVip=ref(false)
const vipClose = () => {
	userStore.updateUserInfo({doLogin:0})
}
const loadVip = () => {
	ajax({
		url:'/chatgpt/config/vip'
	}).then(d=> {
		stvip.value=d.data.cf;
	} )

	if( isOpenVip.value ) setTimeout(()=>isOpenVip.value=false ,1500)
}
onMounted( ()=>{
	if(userInfo.value.isVip) loadVip();
});
const openVip= () => {
	if( stvip.value.bt.indexOf('登录')>=0 || stvip.value.bt.indexOf('login')>=0 ) {
		userStore.updateUserInfo({doLogin:2})
	}
	else{
		isOpenVip.value=true;
	}
}

watch(userInfo, (val, o) =>{
		if(val.doLogin==1 && o?.doLogin==0)   openVip()
		else if( val.doLogin==4 ){
			loadVip();
		}
	}

	, {immediate: true, flush: 'post'} )

</script>

<style scoped>
.mycard{ margin-top: 10px; position: relative; margin-left: 10px ; max-width: 200px ; cursor: pointer; }
.myTitle{ display: flex; flex-wrap: wrap; justify-content: center;margin:0 auto; margin-top: 20px; max-width: 800px;  }
@media  screen and (max-width: 600px){
	.mycard{
		width: 45vw;
		margin-left: 1vw ;
	}
}
</style>
