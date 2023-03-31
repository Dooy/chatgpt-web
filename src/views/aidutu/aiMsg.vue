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

defineExpose({ count, increment,showMsg });

</script>
