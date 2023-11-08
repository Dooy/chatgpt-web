<script setup lang="ts">
import {NInput,NButton,NSelect } from "naive-ui"
import { ref } from "vue"; 
import { mysse,mlog ,webGetContext} from '@/utils/functions'
const st = ref({prompt:'你是谁？',msg:'等待你的提问呢！',model: "text-davinci-002-render-sha",server:'web' });

//{"id":"as-0gtky9bide","object":"chat.completion.chunk","created":1699232347,"model":"ernie-bot","choices":[{"delta":{"content":"具体操作可以参考Redis文档或相关的PHP Redis扩展库文档。"},"finish_reason":"stop"}]}
//{"id":"as-0gtky9bide","object":"chat.completion.chunk","created":1699232347,"model":"ernie-bot","choices":[{"delta":{"content":""},"finish_reason":"stop"}]}

// onMessage>> {"id":"chatcmpl-8HiGjs00aY2ckzn9ZB3duOUA1l5U2","object":"chat.completion.chunk","created":1699232437,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{"content":"G"},"finish_reason":null}]}
// onMessage>> {"id":"chatcmpl-8HiGjs00aY2ckzn9ZB3duOUA1l5U2","object":"chat.completion.chunk","created":1699232437,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{"content":"PT"},"finish_reason":null}]}

const opModle= ref([{
          label: 'GPT3.5',
          value: "text-davinci-002-render-sha"
        }, {
          label: 'GPT4.0',
          value: "gpt-4"
        }]) ;
const serverModle= ref([{
          label: '前段web',
          value: "web"
        }, {
          label: '接入点',
          value: "pt"
        }]) ;

const go = async (  )=>{
    //let model=  "text-davinci-002-render-sha";//'gpt-3.5-turbo'; //gpt-4
    const type= st.value.server;
    let headers ={
        'Content-Type': 'application/json'
        //,'Authorization': 'Bearer mytest'
        ,'Authorization': 'Bearer Aa112211'
        ,'Accept': 'text/event-stream'
    }
    let url='/backend-api/conversation';

    if( type == 'pt' ){
         headers ={
            'Content-Type': 'application/json'
            ,'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UaEVOVUpHTkVNMVFURTRNMEZCTWpkQ05UZzVNRFUxUlRVd1FVSkRNRU13UmtGRVFrRXpSZyJ9.eyJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiJwYXVsNzlwZXRlcnNvbmtqNkBvdXRsb29rLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS9hdXRoIjp7InBvaWQiOiJvcmctYVN1Y2ZnNEVpcXNkckRmeE1CTVZQNEl6IiwidXNlcl9pZCI6InVzZXItUDJuUGttRVhJaU4xY3JFZVBKcWtWTFFHIn0sImlzcyI6Imh0dHBzOi8vYXV0aDAub3BlbmFpLmNvbS8iLCJzdWIiOiJhdXRoMHw2NTNkY2Y2N2M5YTYzMTgzZmY0ZDM4YjEiLCJhdWQiOlsiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MSIsImh0dHBzOi8vb3BlbmFpLm9wZW5haS5hdXRoMGFwcC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNjk5MTc1MzAwLCJleHAiOjE3MDAwMzkzMDAsImF6cCI6IlRkSkljYmUxNldvVEh0Tjk1bnl5d2g1RTR5T282SXRHIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBtb2RlbC5yZWFkIG1vZGVsLnJlcXVlc3Qgb3JnYW5pemF0aW9uLnJlYWQgb3JnYW5pemF0aW9uLndyaXRlIG9mZmxpbmVfYWNjZXNzIn0.OZl80CQi9VKuYFU0WJ0KmSEL4HBMhEkJ1c01L7cfC9lMabw68kmsjk1n-ofC0ewpe9AqruHaXdv-PbDLNNEYCa0YDpTHiCWWzkGVX5Wo1dmSgii-JEEVVKcZLxCK7MdRPnSpAq58UE3Y6cY1w5p_6B6n9MNOO6ljcGCFMXPzD9vmOlLaP6Evo6ftJrneQpW1h07uFQaYs-OrUgVPiFTTEvYa11tmwxA1zsDrPBcI_l8SbUfjpI77GHzJjetO0koUSRCAmkC6vudFU3vT0zwFgWetspx8NVcg3t93zHYmRoA7VKkssuiPiNN2MiCwkNX5dXZ2ZZVO8UHApA9G7FFlwA'
            ,'Accept': 'text/event-stream'
            ,'AUTHKEY': 'xyhelper'
        }
        ,url ='/mmm-api/conversation';
    }
    
    mysse(url
    ,{
        method:'POST'
        ,data:{
            "action": "next",
            "messages": [
                {
                "id": "aaa293c1-410a-4551-a732-89a8ceb2687c",
                "author": {
                    "role": "user"
                },
                "content": {
                    "content_type": "text",
                    "parts": [ st.value.prompt ]
                },
                "metadata": {}
                }
            ],
            "parent_message_id": "aaa10a9b-1130-4942-b3ce-65c5da6de37d",
            "model": st.value.model,
            "plugin_ids": [],
            "timezone_offset_min": -480,
            "suggestions": [
                "Compare design principles for mobile apps and desktop software in a concise table",
                "Brainstorm 5 episode ideas for my new podcast on urban design.",
                "Make up a 5-sentence story about \"Sharky\", a tooth-brushing shark superhero. Make each sentence a bullet point.",
                "Explain options trading in simple terms if I'm familiar with buying and selling stocks."
            ],
            "history_and_training_disabled": false,
            "arkose_token": null,
            "force_paragen": false
            }
            ,headers
        ,onMessage:(d)=>{
            //mlog('消息', d );
            st.value.msg = webGetContext(d ).text ;
        }
    }).then(d=>{
        mlog('结果',d );
        st.value.msg = webGetContext(d ).text ;
}).catch(e=>mlog('失败',e ) );
}

const fenxi = ()=>{
    st.value.msg=webGetContext(st.value.prompt).text;
}
</script>
<template>
<section class="p-2">

    <div class="flex items-center justify-between space-x-2">
         <NSelect v-model:value="st.model"   :options="opModle" class="!w-[120px]" />
         <NSelect v-model:value="st.server"   :options="serverModle" class="!w-[120px]" />
 
        <NInput class="flex-1" v-model:value ="st.prompt" placeholder="请输入问题"  type="textarea" autosize></NInput>
        <NButton @click="go()">发送</NButton>
        <!-- <NButton @click="go('pt')">接入点发送</NButton> -->
    </div>
    <div> <NButton @click="fenxi()">分析</NButton></div>
    <pre class="mt-2 border border-blue-400 p-2 rounded-sm max-w-[620px] whitespace-pre-wrap break-words" v-html="st.msg"></pre>

    <div>
       
    </div>
</section>

</template>