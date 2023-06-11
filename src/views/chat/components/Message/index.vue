<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NDropdown, useMessage,NTooltip } from 'naive-ui'
import AvatarComponent from './Avatar.vue'
import TextComponent from './Text.vue'
import { SvgIcon } from '@/components/common'
import { copyText3} from '@/utils/format' //copyText,
import { useIconRender } from '@/hooks/useIconRender'
import { t } from '@/locales'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import AiMsg from "@/views/aidutu/aiMsg.vue";
import { argv } from 'process'
//import { copyToClip } from '@/utils/copy'

interface Props {
  dateTime?: string
  text?: string
  inversion?: boolean
  error?: boolean
  loading?: boolean
	prompt_tokens?:number
	completion_tokens?:number
  model?:string
  chat?:Chat.Chat
  index?:number
}

interface Emit {
  (ev: 'regenerate'): void
  (ev: 'delete'): void
  (ev: 'imageSend'): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const { isMobile } = useBasicLayout()

const { iconRender } = useIconRender()

const message = useMessage()

const textRef = ref<HTMLElement>()

const asRawText = ref(props.inversion)

const messageRef = ref<HTMLElement>()

const options = computed(() => {
  const common = [
    {
      label: t('chat.copy'),
      key: 'copyText',
      icon: iconRender({ icon: 'ri:file-copy-2-line' }),
    },
    {
      label: t('common.delete'),
      key: 'delete',
      icon: iconRender({ icon: 'ri:delete-bin-line' }),
    },
  ]

  if (!props.inversion) {
    common.unshift({
      label: asRawText.value ? t('chat.preview') : t('chat.showRawText'),
      key: 'toggleRenderType',
      icon: iconRender({ icon: asRawText.value ? 'ic:outline-code-off' : 'ic:outline-code' }),
    })
  }

  return common
})

function handleSelect(key: 'copyText' | 'delete' | 'toggleRenderType') {
  switch (key) {
    case 'copyText':
      //copyText({ text: props.text ?? '' })
			copy();
      return
    case 'toggleRenderType':
      asRawText.value = !asRawText.value
      return
    case 'delete':
      emit('delete')
  }
}

function handleRegenerate() {
  messageRef.value?.scrollIntoView()
  emit('regenerate')
}


const msgRef = ref();
function copy(){
	copyText3( props.text ?? '').then(()=>msgRef.value.showMsg('复制成功！'));

}
 
function sent( a:any ){
  //emits('imageSend', argv)
  a.index=props.index;
  emit('imageSend', a   )
}
const st = ref({is:false});
</script>

<template>
	<ai-msg ref="msgRef"></ai-msg>
  <div
    ref="messageRef"
    class="flex w-full mb-6 overflow-hidden"
    :class="[{ 'flex-row-reverse': inversion }]"
  >
    <div
      class="flex items-center justify-center flex-shrink-0 h-8 overflow-hidden rounded-full basis-8"
      :class="[inversion ? 'ml-2' : 'mr-2']"
    >
      <AvatarComponent :image="inversion" />
    </div>
    <div class="overflow-hidden text-sm " :class="[inversion ? 'items-end' : 'items-start']">
      <p class="text-xs text-[#b4bbc4]" :class="[inversion ? 'text-right' : 'text-left']">
				<span v-if="inversion" style="cursor: pointer" @click="copy()">复制 </span>
        {{ dateTime }}
				<!-- <span v-if="!inversion" style="cursor: pointer" @click="copy()"> 复制</span> -->

					<n-tooltip trigger="hover" v-if="!inversion  &&model=='GPT4.0' && ((prompt_tokens??0)+(completion_tokens??0))>0 " >
						<template #trigger>
							<span  > tokens:{{(prompt_tokens??0)+(completion_tokens??0)}}</span>
						</template>
						问:{{prompt_tokens}} tokens，答:{{completion_tokens}} tokens，共{{ (prompt_tokens??0)+(completion_tokens??0) }} tokens
					</n-tooltip>

      </p>

      <div
        class="flex items-end gap-1 mt-2"
        :class="[inversion ? 'flex-row-reverse' : 'flex-row']"
      >
        <TextComponent
          ref="textRef"
          :inversion="inversion"
          :error="error"
          :text="text"
          :loading="loading"
          :as-raw-text="asRawText"
          :chat="chat"
          @image-send="sent"

        />
        <div class="flex flex-col" v-if="st.is" >
          <button
            v-if="!inversion"
            class="mb-2 transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-300"
            @click="handleRegenerate"
          >
            <SvgIcon icon="ri:restart-line" />
          </button>
          <NDropdown
            :trigger="isMobile ? 'click' : 'hover'"
            :placement="!inversion ? 'right' : 'left'"
            :options="options"
            @select="handleSelect" 
          >
            <button class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200">
              <SvgIcon icon="ri:more-2-fill" />
            </button>
          </NDropdown>
        </div>
      </div>
    </div>
  </div>
</template>
