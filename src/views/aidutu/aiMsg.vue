<template>

</template>
<script lang="ts" setup>
import {  ref } from 'vue';
import {useNotification} from "naive-ui";

const notification = useNotification();
const count = ref(0);

function increment() {
	count.value++;
}
function showMsg(str:string){
	notification.success({
		title: "成功",
		//description: "From the Beach Boys",
		content: str,
		duration: 1500,
		keepAliveOnHover: true
	});
}

function showError(str:string){
	notification.error({
		title: "错误",
		content: str,
		duration: 3000,
		keepAliveOnHover: true
	});
}

defineExpose({ count, increment,showMsg,showError });

</script>
