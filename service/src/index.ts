import express from 'express'
import type { RequestProps } from './types'
import type { ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel } from './chatgpt'
import { auth } from './middleware/auth'
import { limiter } from './middleware/limiter'
import { isNotEmptyString } from './utils/is'

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if(isMainThread){
	const worker = new Worker(__filename, {
		workerData: { sharedData: {cnt: 0, error_des: {}} }
	});

	worker.on('message', (message) => {
		console.log('Received message from worker:', message);
	});

}else {

	const app = express()
	const router = express.Router()


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
				systemMessage,
			})
		} catch (error) {

			try {
				if (error.message && error.message.indexOf('429') > 0) {
					// 获取共享数据
					const sharedData = workerData.sharedData;
					sharedData.cnt++;
					sharedData.error_des = error;
					// 发送消息给主线程
					parentPort.postMessage(sharedData);
				}
			}catch (e) {

			}
			if(error.message)  error.message= "请1分钟后重试\n" +error.message;
			res.write(JSON.stringify(error))

		} finally {
			res.end()
		}
	})

	//检查状态
	router.get('/status', (req, res) => {
		//获取共享数据
		const sharedData = workerData.sharedData;
		if (sharedData.cnt > 0) res.status(403).send(sharedData);
		else res.status(200).send('ok')
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
			if (!token)
				throw new Error('Secret key is empty')

			if (process.env.AUTH_SECRET_KEY !== token)
				throw new Error('密钥无效 | Secret key is invalid')

			res.send({status: 'Success', message: 'Verify successfully', data: null})
		} catch (error) {
			res.send({status: 'Fail', message: error.message, data: null})
		}
	})

	app.use('', router)
	app.use('/api', router)
	app.set('trust proxy', 1)

	app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))

}
