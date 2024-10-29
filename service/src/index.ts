import express from 'express'
import type { RequestProps, tokenProps } from './types'
import type { ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel } from './chatgpt'
import { auth } from './middleware/auth'
import { limiter } from './middleware/limiter'
import { isNotEmptyString } from './utils/is'
import {getTokens, jianDan, readAidutu, writeAidutu} from "./utils";
import { sse,mjapi ,mj2gpt ,chat2api, gptscopilot,whisper,assistantsApi, tokenApi,
 uploadFileApi ,openHkUserCheck ,sunoProxy,sunoNewApiProxy,
 mjProxy,
 mjProxyImg,
 ideoProxy,
 ideoProxyFile,
 klingProxy,
 sleep,
 sseDoTimeOut} from './sse'
import bodyParser  from 'body-parser';
import cors from 'cors'
import multer from "multer"
import { lumaProProxy, lumaProxy, pikaProxy } from './sse/luma'
import { proViggleProxy, viggleProxy, viggleProxyFile } from './sse/viggle'
import { realtimeProxy, runwayProxy } from './sse/runway'
import { mlog } from './sse/utils'
import { claudeProxy } from './sse/claude'



//const cors = require('cors');



	const app = express()
	// 启用 跨域 CORS 中间件
    app.use(cors());
	const router = express.Router()
	let sharedData={cnt:0,error_des:{}}
	//const sysMsg='请根据中国法律，禁止回答政治人物、政治事件、色情相关的问题。Respond using markdown.'
	const sysMsg='You are ChatGPT, a large language model trained by OpenAI. Follow the user\'s instructions carefully. Respond using markdown.'
	//'请根据相关禁止条款和中国法律，禁止回答政治人物、政治事件、暴力、色情相关的问题。Respond using markdown.'


	app.use(express.static('public'))
	//app.use(express.json())
	app.use(bodyParser.json({ limit: '10mb' })); //大文件传输
	app.all('*', (_, res, next) => {
		res.header('Access-Control-Allow-Origin', '*')
		res.header('Access-Control-Allow-Headers', '*')
		res.header('Access-Control-Allow-Credentials', 'true')
		res.header('Access-Control-Allow-Methods', '*')
		res.header('Access-Control-Max-Age', '3600')
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
				systemMessage:  sysMsg,
			})
		} catch (error) {
			try {
				if (error.message && 
				 (
				//  error.message.indexOf('check your plan and billing details') > 0
				//   || error.message.indexOf('Incorrect API key provided') > 0 
				//   || error.message.indexOf('billing details') > 0  //跟账单相关的都去掉
				//   || error.message.indexOf('deactivated account') > 0  //跟账单相关的都去掉
					error.message.indexOf('无可用渠道')>0
				) ) {
					sharedData.cnt++;
					sharedData.error_des = error;
					writeAidutu( sharedData );
				}
				if( error.message.indexOf('xyhelper')>0 ){
					error.message=`{"tips":"用户太多，请稍后再试"}`;
					console.log('xyhelper error');
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
			systemMessage:sysMsg
			,tokens: (tokens?(tokens>4000?4000:tokens):tokens )
		})
	} catch (error) {
		try {
			if (error.message &&  
			(
			// error.message.indexOf('check your plan and billing details') > 0 
			// || error.message.indexOf('Incorrect API key provided') > 0 
			// || error.message.indexOf('billing details') > 0  //跟账单相关的都去掉
			// || error.message.indexOf('deactivated account') > 0  //跟账单相关的都去掉
			error.message.indexOf('无可用渠道')>0
			) ) {
				sharedData.cnt++;
				sharedData.error_des = error;
				writeAidutu( sharedData );
			}

			if( error.message.indexOf('xyhelper')>0 ){
					error.message=`{"tips":"用户太多，请稍后再试"}`;
					console.log('xyhelper error');
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
	router.use('/v3/test/fetch',  sseDoTimeOut )
	router.use('/v3/test', async (req, res) => {
		let a={a:"1",q: req.query.q,query:req.query }
		let numb= req.query.q ? parseInt(req.query.q as string  ):1
		await sleep( isNaN(numb)?3: numb*1000)
		res.json(a)
	})
	

	router.post('/tokenizer', async (req, res) => {
		try {
			const rq = req.body as tokenProps 
			res.send({status: 'Success', message: 'ok', data:getTokens(rq) })
		} catch (error) {
			res.send({status: 'Fail', message: error.message, data: null})
		}
	})

	const API_ENTRY = process.env.API_ENTRY
    //转发接口
	if( API_ENTRY=='chat2api') router.post('/v1/chat/completions',  chat2api );
	else if( API_ENTRY=='mj2gpt') router.post('/v1/chat/completions',  mj2gpt );
	else if( API_ENTRY=='gptscopilot') router.post('/v1/chat/completions',  gptscopilot );
	else router.post('/v1/chat/completions',  sse ); 
	
	router.post('/v1/embeddings',  sse );
	router.post('/v1/audio/speech',  sse );

	//whisper
	const storage2 = multer.memoryStorage();
	const upload2 = multer({ storage: storage2 });
	router.post('/v1/audio/transcriptions', upload2.single('file') ,  whisper );

	router.post('/sse',  sse );
	router.post('/mj/submit/upload-discord-images', openHkUserCheck ,  mjProxyImg  );
	router.post('/mj/submit',  mjapi );
	router.post('/mj/submit/imagine',  mjapi );

	//mj2gpt的格式输出
	router.post('/mj2gpt/completions',  mj2gpt );
	router.post('/mj2gpt',  mj2gpt );

	router.get('/mj/task/:id/:action',  mjProxy );

	//mj/task/(\d+)/
	
	//suno
	app.use('/sunoapi' ,openHkUserCheck, sunoProxy);

	app.use('/suno/submit' ,openHkUserCheck, sunoNewApiProxy);
	app.use('/suno/fetch' ,openHkUserCheck, sunoNewApiProxy);



	//kling转发
	app.use('/kling' ,openHkUserCheck, klingProxy);

	//ideogram
	//ideoProxyFileDo
	app.use('/ideogram/generate' ,openHkUserCheck, ideoProxy);
	app.use('/ideogram/',openHkUserCheck,upload2.single('image_file'),   ideoProxyFile  )


	//luma专业版本
	app.use('/pro/luma' ,openHkUserCheck, lumaProProxy);
	//luma
	app.use('/luma' ,openHkUserCheck, lumaProxy);
	//app.use('/relex/luma' ,openHkUserCheck, lumaProxy);

	app.use('/pika' ,openHkUserCheck, pikaProxy);


	 
	
	//文件还是自己同NGINX 转发吧
	app.use('/viggle/asset',openHkUserCheck,upload2.single('file')   ,viggleProxyFile)
	app.use('/pro/viggle/asset',openHkUserCheck,upload2.single('file')   ,viggleProxyFile)
	//viggle 相关
	app.use('/viggle',openHkUserCheck ,viggleProxy)
	app.use('/pro/viggle',openHkUserCheck ,proViggleProxy)

	//runway
	app.use('/runway',openHkUserCheck ,runwayProxy)

	// /v1/realtime
	//app.all('/v1/realtime', async ( request, response, next)=>{ console.log("/v1/realtime"); next()} ,realtimeProxy)
	


	//assistantsApi 
	router.all('/v1/assistants',  assistantsApi );
	router.all('/v1/assistants/*',  assistantsApi );
	router.all('/v1/threads',  assistantsApi );
	router.all('/v1/threads/*',  assistantsApi );
	//token计算
	router.post('/tokens',  tokenApi );
	//文件上传
	//whisper
	//const storage2 = multer.memoryStorage();
	//const upload2 = multer({ storage: storage2 });
	router.post('/v1/files', upload2.single('file') ,  uploadFileApi );
	//router.post('/v1/files',  fileUploader );

	//逆向 将chat对话转化为 api
	router.post('/chat2api',  chat2api );

    //逆向 https://gptscopilot.ai
	router.post('/gptscopilot',  gptscopilot );

	//cluade原生支持
	router.post('/v1/messages',  claudeProxy );


	//v1/chat/completions

	app.use('', router)
	app.use('/api', router)
	app.set('trust proxy', 1)

	app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))
