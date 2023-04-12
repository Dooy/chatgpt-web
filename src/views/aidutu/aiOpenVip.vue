<template>
	<div v-if="uvip.isOver<=-1">
		你未开通会员  (UID:{{uvip.user_id}})
	</div>
	<template v-else-if="uvip.dsEnd">
	<div v-if="uvip.isOver">你的会员已截止 (UID:{{uvip.user_id}})</div>
		<div v-else>你的会员不足<b>{{uvip.dsTs}}</b>, 将在 <b >{{uvip.dsEnd}}</b> 到期  (UID:{{uvip.user_id}})</div>
	</template>
	<div  v-html="info.msg"></div>

<div class="myTitle" v-if="stVip.length>0">
	<n-card :title="`${v2.ds}元`" size="small" class="mycard payCard" :class="{me:k==dfSelect}"  v-for="(v2,k) in stVip" @click="go(v2)">
		{{v2.info}}
	</n-card>
</div>
	<div style="display: flex; justify-content: center; margin-top: 20px" >
		<div v-if="isWechat">
			<n-button type="info" @click="goUrl(st.pay.url )">点我微信支付</n-button>
		</div>
		<template v-else>
		<QRCodeVue3 :width="200"  :height="200" :value="st.pay.url" v-if="st.pay.url" class="wx-qr"/>
		<div  class="wx-qr" v-else>
     二维码Loaidng
		</div>
		<div style="  margin-left: 20px; margin-top: 0px">
			<span style="transform: translateY(4px) ;display: inline-block"><svg data-v-795b2144="" t="1669863099595" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"   width="16" height="16" class="icon"><path d="M664.250054 368.541681c10.015098 0 19.892049 0.732687 29.67281 1.795902-26.647917-122.810047-159.358451-214.077703-310.826188-214.077703-169.353083 0-308.085774 114.232694-308.085774 259.274068 0 83.708494 46.165436 152.460344 123.281791 205.78483l-30.80868 91.730191 107.688651-53.455469c38.558178 7.53665 69.459978 15.308661 107.924012 15.308661 9.66308 0 19.230993-0.470721 28.752858-1.225921-6.025227-20.36584-9.521864-41.723264-9.521864-63.862493C402.328693 476.632491 517.908058 368.541681 664.250054 368.541681zM498.62897 285.87389c23.200398 0 38.557154 15.120372 38.557154 38.061874 0 22.846334-15.356756 38.156018-38.557154 38.156018-23.107277 0-46.260603-15.309684-46.260603-38.156018C452.368366 300.994262 475.522716 285.87389 498.62897 285.87389zM283.016307 362.090758c-23.107277 0-46.402843-15.309684-46.402843-38.156018 0-22.941502 23.295566-38.061874 46.402843-38.061874 23.081695 0 38.46301 15.120372 38.46301 38.061874C321.479317 346.782098 306.098002 362.090758 283.016307 362.090758zM945.448458 606.151333c0-121.888048-123.258255-221.236753-261.683954-221.236753-146.57838 0-262.015505 99.348706-262.015505 221.236753 0 122.06508 115.437126 221.200938 262.015505 221.200938 30.66644 0 61.617359-7.609305 92.423993-15.262612l84.513836 45.786813-23.178909-76.17082C899.379213 735.776599 945.448458 674.90216 945.448458 606.151333zM598.803483 567.994292c-15.332197 0-30.807656-15.096836-30.807656-30.501688 0-15.190981 15.47546-30.477129 30.807656-30.477129 23.295566 0 38.558178 15.286148 38.558178 30.477129C637.361661 552.897456 622.099049 567.994292 598.803483 567.994292zM768.25071 567.994292c-15.213493 0-30.594809-15.096836-30.594809-30.501688 0-15.190981 15.381315-30.477129 30.594809-30.477129 23.107277 0 38.558178 15.286148 38.558178 30.477129C806.808888 552.897456 791.357987 567.994292 768.25071 567.994292z" p-id="2727" fill="#00be82"></path></svg>
      </span>请使用微信扫一扫付款

			<div style="margin-top: 20px;">

				<n-button type="info" ghost @click="checkCz">我已充值成功 刷新</n-button>
			</div>

		</div>
		</template>
	</div>

	<ai-msg ref="msgRef"></ai-msg>
</template>

<script lang='ts' setup>

import {onMounted, ref} from "vue";
import {ajax} from "@/api";
import { NCard ,NButton} from 'naive-ui'
import QRCodeVue3 from "qrcode-vue3";
import AiMsg from "@/views/aidutu/aiMsg.vue";

const emit =defineEmits(['toLogin','success']);
const stVip=ref([]);
const dfSelect=ref(0)
const st=ref({pay:{ds:'',url:'',info:''}})
const uvip= ref({'dsEnd':'',isOver:0,'dsTs':'',user_id:0,last_order_id:0})
const isWechat = ref( /MicroMessenger/i.test(navigator.userAgent) ); //是否在微信内
const msgRef = ref();
const info=ref({msg:''})


onMounted(()=>{
	ajax({
		url:'/chatgpt/config/cz'
	}).then(d=>{
		if(d.error==317){
			emit('toLogin'); //user_id
			return ;
		}
		stVip.value=d.data.cf ;

		//dfSelect.value=d.data.st.index;
		go( d.data.cf[d.data.st.index]);
		//uvip.value= d.data.uvip?d.data.uvip:{'dsEnd':''};
		if( d.data.uvip )uvip.value=d.data.uvip
		info.value= d.data.info;
		//console.log('ddd',d , uvip.value )
	} )
});

const go = (v2) => {
  //console.log('pay',v2);
	dfSelect.value= stVip.value.indexOf(v2);
	st.value.pay=v2;
	//if(isWechat) location.href=v2.url;
}
const goUrl= (url:string)=>  location.href=url

const checkCz = () => {

	ajax({
		url:'/chatgpt/config/cz'
	}).then(d=>{
		if(d.error==317){
			emit('toLogin'); //user_id
			return ;
		}
		//stVip.value=d.data.cf ;
		if( d.data.uvip.last_order_id!=uvip.value.last_order_id ){
			msgRef.value.showMsg('充值成功！');
			emit('success');
			uvip.value=d.data.uvip;
		}else{
			console.log( 'last_id', d.data.uvip.last_order_id , uvip.value.last_order_id );
			msgRef.value.showError('充值未成功！');
		}

	} )

}

</script>

<style scoped>
.mycard{ margin-top: 10px; position: relative; margin-left: 10px ; max-width: 130px ; cursor: pointer; }
.myTitle{ display: flex; flex-wrap: wrap; justify-content: center;margin:0 auto; margin-top: 20px; max-width: 800px;  }
@media  screen and (max-width: 600px){
	.mycard{
		width: 45vw;
		margin-left: 1vw ;
	}
}
.wx-qr{
	width: 150px; height: 150px;display: flex;text-align: center;align-items: center;justify-content: center;
	border: 0px solid #ccc; border-radius:5px;
	background-color: #666666;
}
</style>
<style>
.payCard.n-card > .n-card-header .n-card-header__main {
	color: #f0a020;

}
.me.n-card{
	border: 1px solid  #f0a020;
}
</style>
