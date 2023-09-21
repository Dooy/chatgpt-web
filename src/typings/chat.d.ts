declare namespace Chat {

	interface Chat {
		dateTime: string
		text: string
		inversion?: boolean
		error?: boolean
		loading?: boolean
		conversationOptions?: ConversationRequest | null
		requestOptions: { prompt: string; options?: ConversationRequest | null }
		prompt_tokens?:number
		completion_tokens?:number
		model?:string //模型
		mj_id?:number //数据库的id
		mj_type?:'C'|'U'|'V'
		mj_opt?:any
		mj_bt?:string[]
		uri?:string //图片地址
		uri_base64?:string //图片本地base64
		error_des?:string //错误信息
	}

	interface History {
		title: string
		isEdit: boolean
		uuid: number
	}

	interface ChatState {
		active: number | null
		usingContext: boolean;
		history: History[]
		chat: { uuid: number; data: Chat[] }[]
	}

	interface ConversationRequest {
		conversationId?: string
		parentMessageId?: string
	}

	interface ConversationResponse {
		conversationId: string
		detail: {
			choices: { finish_reason: string; index: number; logprobs: any; text: string }[]
			created: number
			id: string
			model: string
			object: string
			usage: { completion_tokens: number; prompt_tokens: number; total_tokens: number }
		}
		id: string
		parentMessageId: string
		role: string
		text: string
	}
}
