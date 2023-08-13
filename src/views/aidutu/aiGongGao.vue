<script setup lang="ts">
import { ajax } from '@/api';
import { useUserStore } from '@/store';
import { onMounted , ref ,watch ,computed} from 'vue'
const userStore = useUserStore()
//const st= ref({ isBaidu:false });
const st = ref({mark:'',arr:[],isBaidu:false}); //UID:239923

function load(){
    ajax({url:'/chatgpt/config/gonggao'}).then(d=>  {
       // console.log('gonggao',d.data.cf ); 
        userStore.updateUserInfo(d.data.cf)
        document.title = d.data.cf.name
        if(!st.value.isBaidu) baidu(  d.data.cf.tj);
        st.value.mark= d.data.cf.mark;
    }
    );
}

function baidu( id:string ){
    st.value.isBaidu=true;
    console.log('baidu' ); 
    var hm = document.createElement("script");
		hm.src = "https://hm.baidu.com/hm.js?"+id;
		var s = document.getElementsByTagName("script")[0];
		s.parentNode.insertBefore(hm, s);
}
function createWatermark() {
    
     let i2=200 ,i3=230;
     for ( let j=0;j<30;j++){
        let top2=-100+(j*i3) ;
        for(let i=0; i<30;i++){
            let left= (-120+i*i2+ Math.random()*100)+'px';
            let top = (top2+ Math.random()*100)+'px';
            st.value.arr.push({left,top}) ;
        }
     }
     

}

onMounted(()=>{
    createWatermark();
});
const active= computed(()=>userStore.userInfo.action);
watch( active ,(n)=>{
    //console.log('active', n);
    if(n=='loginSuccess') {
         console.warn('gogo loadactive');
        load()
    }
})

load();
</script>
<template>
<template v-if="st.mark">
    <span v-html="st.mark" class="fls" :style="s" v-for="s in st.arr"></span>
</template>
</template>
<style scoped>
.fls{
    font-size: 14px;
color: rgba(0, 0, 0, 0.07);
position: fixed;
transform: rotate(-30deg);
padding:100px;
pointer-events: none;
z-index: 200;
}
</style>
<style>
.dark .fls{
    color: #fff;
    opacity: 0.2;
}
</style>