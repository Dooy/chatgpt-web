<script setup lang='ts'>
import {computed, ref} from 'vue'
import { NAvatar } from 'naive-ui'
import { useUserStore } from '@/store'
import defaultAvatar from '@/assets/avatar.jpg'
import { isString } from '@/utils/is'

const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)
const isAd=ref(true);
</script>

<template>
  <div class="flex items-center overflow-hidden">
    <div class="w-10 h-10 overflow-hidden rounded-full shrink-0">
      <template v-if="isString(userInfo.avatar) && userInfo.avatar.length > 0">
        <NAvatar
          size="large"
          round
          :src="userInfo.avatar"
          :fallback-src="defaultAvatar"
        />
      </template>
      <template v-else>
        <NAvatar size="large" round :src="defaultAvatar" />
      </template>
    </div>
    <div class="flex-1 min-w-0 ml-2">
      <h2 class="overflow-hidden font-bold text-md text-ellipsis whitespace-nowrap">
        {{ userInfo.name ?? '你的名字' }}
      </h2>
      <p class="overflow-hidden text-xs text-gray-500 text-ellipsis whitespace-nowrap" v-if="isAd">
				<!-- <span>友链 <a href="https://123.lingduquan.com" class="text-blue-500" target="_blank" >AI网站导航</a></span> -->
        <span v-if="userInfo.description" v-html="userInfo.description"></span>
      </p>
			<p class="overflow-hidden text-xs text-gray-500 text-ellipsis whitespace-nowrap" v-else>
        <span
					v-if="isString(userInfo.description) && userInfo.description !== ''"
					v-html="userInfo.description"
				/>
			</p>
    </div>
  </div>
</template>
