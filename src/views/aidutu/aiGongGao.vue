<script setup lang="ts">
import { ajax } from '@/api';
import { useUserStore } from '@/store';
const userStore = useUserStore()

function load(){
    ajax({url:'/chatgpt/config/gonggao'}).then(d=>  {
       // console.log('gonggao',d.data.cf ); 
        userStore.updateUserInfo(d.data.cf)
        document.title = d.data.cf.name
        baidu(  d.data.cf.tj);
    }
    );
}

function baidu( id:string ){
    var hm = document.createElement("script");
		hm.src = "https://hm.baidu.com/hm.js?"+id;
		var s = document.getElementsByTagName("script")[0];
		s.parentNode.insertBefore(hm, s);
}
load();
</script>
<template>

</template>