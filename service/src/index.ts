import express from 'express'
import type { RequestProps, tokenProps } from './types'
import type { ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel } from './chatgpt'
import { auth } from './middleware/auth'
import { limiter } from './middleware/limiter'
import { isNotEmptyString } from './utils/is'
import {getTokens, jianDan, readAidutu, writeAidutu} from "./utils";




	const app = express()
	const router = express.Router()
	let sharedData={cnt:0,error_des:{}}


	app.use(express.static('public'))
	app.use(express.json())

	app.all('*', (_, res, next) => {
		res.header('Access-Control-Allow-Origin', '*')
		res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')
		res.header('Access-Control-Allow-Methods', '*')
		next()
	})

	router.post('/chat-process', [auth, limiter], async (req, res) => {
		res.setHeader('Content-type', 'application/octet-stream')

		try {
			const {prompt, options = {}, systemMessage} = req.body as RequestProps
			let firstChunk = true
			await chatReplyProcess({
				message: prompt,
				lastContext: options,
				process: (chat: ChatMessage) => {
					res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
					firstChunk = false
				},
				systemMessage:'请根据相关禁止条款和中国法律，禁止回答政治人物、政治事件、暴力、色情相关的问题。Respond using markdown.',
			})
		} catch (error) {
			try {
				if (error.message &&  (error.message.indexOf('check your plan and billing details') > 0 || error.message.indexOf('Incorrect API key provided') > 0 ) ) {
					sharedData.cnt++;
					sharedData.error_des = error;
					writeAidutu( sharedData );
				}
			}catch (e) {

			}


			//if(error.message)  error.message= "抱歉，用户太多，余额耗尽了，站长正在充值的路上，请收藏下网址，等会再试试吧。欢迎给我们打赏帮我们分担一些成本。\n\n" +error.message;
			res.write(JSON.stringify(error))




		} finally {
			res.end()
		}
	})

  //自己的优化下自己的传输方案
	router.post('/chat-me', [auth, limiter], async (req, res) => {
	res.setHeader('Content-type', 'application/octet-stream')
	try {
		const {prompt, options = {}, systemMessage,tokens} = req.body as RequestProps
		let firstChunk = true
		await chatReplyProcess({
			message: prompt,
			lastContext: options,
			process: (chat: ChatMessage) => {
				res.write(firstChunk ? `${JSON.stringify(chat)}` :(`\n`+ (chat.delta? JSON.stringify( jianDan(chat) ): JSON.stringify(chat) )  ) ) // `\n${JSON.stringify(chat)}`)
				firstChunk = false
			},
			systemMessage,tokens
		})
	} catch (error) {
		try {
			if (error.message &&  (error.message.indexOf('check your plan and billing details') > 0 || error.message.indexOf('Incorrect API key provided') > 0 ) ) {
				sharedData.cnt++;
				sharedData.error_des = error;
				writeAidutu( sharedData );
			}
		}catch (e) {

		}


		//if(error.message)  error.message= "抱歉，用户太多，余额耗尽了，站长正在充值的路上，请收藏下网址，等会再试试吧。欢迎给我们打赏帮我们分担一些成本。\n\n" +error.message;
		res.write(JSON.stringify(error))




	} finally {
		res.end()
	}
})


	//检查状态
	router.get('/status', async (req, res) => {
		try {
			let sharedData = await readAidutu();
			res.status(403).send(sharedData);
		}catch (e){
		  res.status(200).send('ok')
		}
	});

	router.post('/config', auth, async (req, res) => {
		try {
			const response = await chatConfig()
			res.send(response)
		} catch (error) {
			res.send(error)
		}
	})

	router.post('/session', async (req, res) => {
		try {
			const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
			const hasAuth = isNotEmptyString(AUTH_SECRET_KEY)
			res.send({status: 'Success', message: '', data: {auth: hasAuth, model: currentModel()}})
		} catch (error) {
			res.send({status: 'Fail', message: error.message, data: null})
		}
	})

	router.post('/verify', async (req, res) => {
		try {
			const {token} = req.body as { token: string }
			

			res.send({status: 'Success', message: 'Verify successfully', data: null})
		} catch (error) {
			res.send({status: 'Fail', message: error.message, data: null})
		}
	})

	router.post('/tokenizer', async (req, res) => {
		try {
			const rq = req.body as tokenProps 
			res.send({status: 'Success', message: 'ok', data:getTokens(rq) })
		} catch (error) {
			res.send({status: 'Fail', message: error.message, data: null})
		}
	})

	app.use('', router)
	app.use('/api', router)
	app.set('trust proxy', 1)

	app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))
