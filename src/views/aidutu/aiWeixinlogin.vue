<template>
	<div style="color: #999999;padding-bottom: 10px">为防被恶意调用，请扫码关注微信后再继续使用</div>
<div style="text-align: center; position: relative;justify-content: center">

	<div v-if="st.timeout" class="wx-qr">
		超时了...
	</div>
	<template v-else>
		<QRCodeVue3 :width="200"  :height="200" :value="qr.url" v-if="qr.url" class="wx-qr"/>
		<div v-else class="wx-qr">Loading...</div>
	</template>


	<div style="color: #999999">
      <span style="transform: translateY(4px) ;display: inline-block"><svg data-v-795b2144="" t="1669863099595" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"   width="16" height="16" class="icon"><path d="M664.250054 368.541681c10.015098 0 19.892049 0.732687 29.67281 1.795902-26.647917-122.810047-159.358451-214.077703-310.826188-214.077703-169.353083 0-308.085774 114.232694-308.085774 259.274068 0 83.708494 46.165436 152.460344 123.281791 205.78483l-30.80868 91.730191 107.688651-53.455469c38.558178 7.53665 69.459978 15.308661 107.924012 15.308661 9.66308 0 19.230993-0.470721 28.752858-1.225921-6.025227-20.36584-9.521864-41.723264-9.521864-63.862493C402.328693 476.632491 517.908058 368.541681 664.250054 368.541681zM498.62897 285.87389c23.200398 0 38.557154 15.120372 38.557154 38.061874 0 22.846334-15.356756 38.156018-38.557154 38.156018-23.107277 0-46.260603-15.309684-46.260603-38.156018C452.368366 300.994262 475.522716 285.87389 498.62897 285.87389zM283.016307 362.090758c-23.107277 0-46.402843-15.309684-46.402843-38.156018 0-22.941502 23.295566-38.061874 46.402843-38.061874 23.081695 0 38.46301 15.120372 38.46301 38.061874C321.479317 346.782098 306.098002 362.090758 283.016307 362.090758zM945.448458 606.151333c0-121.888048-123.258255-221.236753-261.683954-221.236753-146.57838 0-262.015505 99.348706-262.015505 221.236753 0 122.06508 115.437126 221.200938 262.015505 221.200938 30.66644 0 61.617359-7.609305 92.423993-15.262612l84.513836 45.786813-23.178909-76.17082C899.379213 735.776599 945.448458 674.90216 945.448458 606.151333zM598.803483 567.994292c-15.332197 0-30.807656-15.096836-30.807656-30.501688 0-15.190981 15.47546-30.477129 30.807656-30.477129 23.295566 0 38.558178 15.286148 38.558178 30.477129C637.361661 552.897456 622.099049 567.994292 598.803483 567.994292zM768.25071 567.994292c-15.213493 0-30.594809-15.096836-30.594809-30.501688 0-15.190981 15.381315-30.477129 30.594809-30.477129 23.107277 0 38.558178 15.286148 38.558178 30.477129C806.808888 552.897456 791.357987 567.994292 768.25071 567.994292z" p-id="2727" fill="#00be82"></path></svg>
      </span>请使用微信扫一扫 关注并登录
	</div>
	<div v-if="st.isMobile">
		<div>或</div>
		<n-button  type="success" @click="copy()">复制网址进微信使用</n-button>
	</div>
</div>
</template>

<script setup lang='ts'>
import QRCodeVue3 from "qrcode-vue3";
import {ajax} from "@/api";
import {useBasicLayout} from "@/hooks/useBasicLayout";
import {NButton} from "naive-ui";
import {useUserStore} from "@/store";
//import AiMsg from "@/views/aidutu/aiMsg.vue";
import {copyText} from "@/utils/format";
import {onMounted, onUnmounted, ref} from "vue";
const { isMobile } = useBasicLayout()
const userStore = useUserStore()
const $emit=defineEmits(['success','copy']);

const qr =  ref({"url": "", 'checkUrl':''});
const st =  ref({timeout:0,cnt: 0,isMobile:isMobile});
const msg= ref();
const copy= ()=>{
	$emit('copy',location.href)
}

const loadQr= ()=>{
	userStore.updateUserInfo({action:''})
	ajax({url:'/oauth/weixin/chat'}).then(d=> {
		console.log('wx',d )
		qr.value.url= d.data.rz.url //data.rz.url
		qr.value.checkUrl= d.data.rz.checkUrl //data.rz.url
		//this.check();
		check();
	});
}
const check = ()=>{
	if( st.value.timeout ) return ;
	
	ajax({url: qr.value.checkUrl}).then(d=>{
		console.log('check', st.value.cnt  ); //djj/user/logout
		st.value.cnt++;
		if(d.data.rz.user_id){
			$emit('success');
			console.log('登录成功') //djj/user/logout 登出
			userStore.updateUserInfo({action:'loginSuccess'})
			return;
		}
		if( st.value.cnt>60 ) {
			st.value.timeout =1;
			return;
		}
		let ms= d.data.rz.open_id?500:1500;
		setTimeout( check, ms );
	})
}

onMounted( ()=>loadQr() );
onUnmounted(()=>{ st.value.timeout=1;})
</script>

<style scoped>
.wx-qr{
	position: relative; justify-content: center; height: 220px;  -webkit-box-align: center; display: flex; margin: 10px 0;
	transform: translateY(-20px);
	text-align: center;align-items: center; font-size: 30px;font-weight: 600
}
</style>
