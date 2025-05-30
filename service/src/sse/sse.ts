import { time } from 'console';
import { Request, Response, NextFunction } from 'express';
import { isNotEmptyString } from 'src/utils/is';
import { fetchSSE } from './fetch-sse';
import { createRedis, redisClose } from './redis';
import { publishData } from './rabittmq';
import fetch from 'node-fetch';
import { RedisClientType } from 'redis';
import { generateRandomCode, mError, mlog } from './utils';
import axios from 'axios';
import FormData from 'form-data'
import mp3Duration from 'mp3-duration'

export const checkWhileIp = async (uid: number, request: Request, redis: RedisClientType) => {
    const kk = `cw:${uid}`; //白名单设置
    //const redis= await createRedis();
    let mstr: any = await redis.get(kk);
    let mvar: any = mstr ? JSON.parse(mstr) : {};
    if (!mstr || !mvar || Object.keys(mvar).length == 0) {
        let res = await fetch(`${process.env.SSE_HTTP_SERVER}/openai/client/scheck/${uid}`)
        const rdate: any = await res.json()
        console.log('服务端获取ip白名单信息>>', uid, rdate?.data?.wdata);
        const wdata = rdate?.data?.wdata;
        if (wdata) {
            //await Object.keys(wdata).map(async k=>{ await redis.hSet(kk,k,wdata[k]) });
            await redis.set(kk, JSON.stringify(wdata));
            await redis.expire(kk, 1800); // 30分钟 
            mvar = wdata;
        }
    }
    //先关闭
    //await redis.disconnect();
    // await redisClose( redis);
    //console.log('ip白名单信息>>', uid , mvar.wip   );
    if (!mvar.wip || mvar.wip.length == 0) {
        //mlog('log',uid , "WIP 白名单无" )

        return;
    }
    const fip = getIP(request);
    if (fip == '') {
        mlog('log', uid, "未获取到 x-forwarded-for ip");

        return;
    }

    const wip = mvar.wip as string[];
    if (wip.length > 0 && wip.indexOf(fip) == -1) {
        mlog('log', uid, "ip-limit", fip);

        throw new mError(`请将你的IP加入白名单`);

    }


}

function getIP(obj: Request) {
    //x-forwarded-for
    if (obj.header && obj.header('x-forwarded-for')) {
        const str = <string>obj.header('x-forwarded-for');
        const arr = str.split(',');
        return arr[0];
    }
    return '';
}

//export async function getMyKey(authorization:string,body:any):Promise<any> {
//获取key 验证key 验证码积分的地方； 验证码ip百名单也在
export async function getMyKey(request: Request, enType: string): Promise<any> {
    //authorization:string,body:any
    //if(authorization)
    let authorization = request.headers['authorization'];
    if (enType == 'mj' && request.headers['mj-api-secret'] != undefined) {
        //request.headers['mj-api-secret']?? request.headers['authorization']
        authorization = (request.headers['mj-api-secret'] ?? request.headers['authorization']) as string;
    }
    if (enType == 'claude' && request.headers['x-api-key'] != undefined) {
        authorization = (request.headers['x-api-key'] ?? request.headers['authorization']) as string;
    }
    // const body= request.body;

    if (!authorization || authorization == '') throw new mError("HK KEY ERROR, KEY缺失");
    const arr = authorization.split('-');

    if (!arr[1]) throw new mError("HK KEY ERROR, KEY格式错误！");
    const redis = await createRedis();
    try {
        const rz = await getMyKeyDo(arr, request, redis, enType)
        await redisClose(redis);
        return rz;
    } catch (err) {
        //if (err instanceof mError) {
        mlog("error redisClose")
        await redisClose(redis);
        throw err
        //} 
    }

}

const getMyKeyDo = async (arr: string[], request: Request, redis: RedisClientType, enType: string) => {
    //body:any
    const body = request.body;
    const kk = `hk:${arr[1]}`;
    let mvar: any = await redis.hGetAll(kk);

    if (!mvar || Object.keys(mvar).length == 0 || !mvar.uid || +mvar.uid <= 0) {

        let res = await fetch(`${process.env.SSE_HTTP_SERVER}/openai/client/hk/${arr[1]}`)
        const rdate: any = await res.json()
        mlog("log", '服务端获取用户信息>>', rdate?.data?.hk, kk);
        //await redis.HSET(kk, );
        const hk = rdate?.data?.hk
        if (hk) {
            await Object.keys(hk).map(async k => { await redis.hSet(kk, k, hk[k]) });
            await redis.expire(kk, 300); //5分钟 不然充值后 余额一直都不更新
        }
        mvar = hk;
    }
    const fen = +(mvar?.fen ?? 0);

    if (!mvar.uid || +mvar.uid <= 0) {
        //await redisClose( redis);
        console.log('HK key error , is no exit  ! HK key 不存在！', kk);
        throw new mError('HK key error , is no exit  ! HK key 不存在！');
    }
    if (fen <= 0) {
        console.log(kk, 'Insufficient points, please recharge 积分不足，请充值');
        //await redisClose( redis);
        throw new mError('Insufficient points, please recharge 积分不足，请充值');
    }
    let attr: any = {}
    if (mvar.son) {
        checkSon(mvar.son, request, enType);
    } else {
        const kk2 = `attr:${mvar.uid}`;
        attr = await redis.hGetAll(kk2);
        if (!attr || attr.hk_gpt3 == undefined) {
            let res = await fetch(`${process.env.SSE_HTTP_SERVER}/openai/client/hkopt/${mvar.uid}`)
            const rdate: any = await res.json()
            console.log('服务端获取用户设置>>', rdate?.data?.userAttr, kk2);
            //await redis.HSET(kk, );
            const hk = rdate?.data?.userAttr
            if (hk) {
                await Object.keys(hk).map(async (k) => { await redis.hSet(kk2, k, hk[k]) });
                await redis.expire(kk2, 300); //5分钟 不然充值后 余额一直都不更新
            }
            attr = hk;
        }
        if (body.model) {
            const model = body.model as string;
            checkModelFotbitten(model, attr)
            await checkBingfa(mvar, redis, body.model)
        } else if (enType == 'mj') {
            checkModelFotbitten('midjourney', attr);
            await checkBingfa(mvar, redis, 'midjourney')
        } else if (enType == 'suno-v3') {
            checkModelFotbitten(enType, attr);
            //await checkBingfa(mvar, redis, enType ) // suno-v3 去除并发限制
        }
        //ip白名单
        await checkWhileIp(+mvar.uid, request, redis);


    }
    //mlog('attr', attr );



    const poolkey = await getKeyFromPool(redis, +mvar.uid, body); //从卡池中获取key
    const parr = poolkey.split('||');


    //await redisClose( redis);
    return { key: 'Bearer ' + parr[0], user: mvar, apiUrl: parr[1] ?? '', attr };
}

//并发限制
const checkBingfa = async (mvar: any, redis: RedisClientType, model: string) => {
    if (model.indexOf('gpt-4') > -1 || model == 'midjourney'
        || model.indexOf('opus') > -1  //claude-3-opus
        || model.indexOf('suno') > -1) { //限制
    } else return;

    if (model.indexOf('gpt-4o-mini') > -1) { //不限制
        return;
    }
    const now = new Date();
    // 获取小时和分钟
    const hour = now.getHours();
    const minute = now.getMinutes();
    const kk2 = `l:${mvar.uid}:${hour}-${minute}`;
    //const is= await redis.keys(kk2 );
    const kv = await redis.incr(kk2);
    await redis.expire(kk2, 60);
    //const kv= re

    let lFen = 3000, fen = + mvar.fen;
    if (fen < 20000) {
        lFen = 1
    } else if (fen < 100000) {
        lFen = 5
    }
    else if (fen < 300000) {
        lFen = 15
    }
    else if (fen < 1000000) lFen = 50
    else if (fen < 2000000) lFen = 100
    //else if(fen<3000000)  lFen=150

    mlog('log', model, kk2, kv, lFen, mvar.fen);
    if (kv > lFen) throw new mError(`已触发低积分多请求限制(${lFen}RPM),请充值或者过1分钟后重试`);

}

//子账号限制
const checkSon = (son: string, request: Request, enType: string) => {
    let ajson: any = {};
    const body = request.body;
    try {
        ajson = JSON.parse(son);
        mlog('checkson', ajson);
        //是否启用
        if (ajson.status != '1') {
            throw new mError(`该KEY被禁用！`);
        }
        //模型限制
        if (ajson.model && ajson.model.length > 0) {
            const models = ajson.model as string[];
            const uModel = enType == 'mj' ? 'midjourney' : body.model;
            if (models.indexOf(uModel) == -1) throw new mError(`模型 ${uModel} 未开启！`);
        }

        //余额积分
        if (ajson.unlimited_quota != '1' && +ajson.remain_quota < 0) {
            throw new mError(`子key余额积分不足！`);
        }
        //过期
        if (ajson.expired_time != '0') {
            const now = new Date();
            //mlog('ex=', now.getTime()," ", +ajson.expired_time*1000 )
            if (now.getTime() > +ajson.expired_time * 1000) {
                throw new mError(`子key已过期！`);
            }
        }
        //ip白名单
        if (ajson.ip && ajson.ip.length > 0) {
            const ip = ajson.ip as string[];
            const fip = getIP(request);
            if (ip.indexOf(fip) == -1) {
                mlog('ip', fip);
                throw new mError(`子key:ip白名单限制！`);
            }
        }
    } catch (e) {

        if (e instanceof mError) {
            let authorization = (request.headers['mj-api-secret'] ?? request.headers['authorization']) as string;
            mlog('log', 'checkson', authorization, " ", e.reason);
            throw e;
        }
        else console.log('checkSon>> ', e);
        return;
    }
    //
}

//禁用
export const checkModelFotbitten = (model: string, attr: any) => {
    let forBitten = false;
    let is35 = model.indexOf('text-embedding') > -1 || model.indexOf('tts') > -1 || model.indexOf('whisper') > -1
    if (model.indexOf('gpt-3.5') > -1 || is35) {
        forBitten = attr.hk_gpt3 && '1' === attr.hk_gpt3;
    } else if (model.indexOf('dall-e') > -1 || model.indexOf('midjourney') > -1) {
        forBitten = attr.hk_draw && '1' === attr.hk_draw;
    } else if (model.indexOf('gpt-4-all') > -1 || model.indexOf('gpt-4-gizmo') > -1) {
        forBitten = attr.hk_gpts && '1' === attr.hk_gpts;
        //}else if(model.indexOf('gpt-4')>-1 || model.indexOf('claude-3')>-1   ){
    } else { //默认就到gpt4
        forBitten = attr.hk_gpt4 && '1' === attr.hk_gpt4;
    }
    if (forBitten) throw new mError(`模型 ${model} 已禁用`);


}

//取 0到 max-1随机数
function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

async function getKeyFromPool(redis: RedisClientType, uid: number, body: any, oldkey?: string): Promise<string> {
    //GAO_KEY 如果有搞并发key 直接用高并发key
    if (isNotEmptyString(process.env.GAO_KEY)) {
        return process.env.GAO_KEY;
    }
    const model = body.model;

    let key = 'pool:3k';
    if (model?.indexOf('gpt-4') >= 0) key = 'pool:4k';

    //    "model": "gpt-4-vision-preview" 支持 vision
    if (model?.indexOf('vision') >= 0) key = 'pool:4v';

    //gpts 多模态 直接走这个路口
    if (model?.indexOf('gizmo') >= 0) key = 'pool:4g';

    //gpt-4-all 要判断是否带链接 代理丢到key池 不带链接到多模态
    if (model == 'gpt-4-all') {
        const msg = JSON.stringify(body.messages);
        //mlog('msg', msg )
        if (msg.toLocaleLowerCase().indexOf('http') == -1) key = 'pool:4g';
    }

    const rz = await redis.get(key);
    mlog('test redis>>', key, rz);
    const kesy = JSON.parse(rz);
    if (kesy.length == 0) {
        if (oldkey) return oldkey;
        throw new mError(`model ${model} pools no key`);
    }
    const ik = getRandomInt(kesy.length);
    //console.log('test redis>>',  kesy.length  );
    return kesy[ik];
    // if(oldkey && kesy.indexOf(oldkey)>=0){
    //      return oldkey;
    // }
    // return kesy[ uid %kesy.length];

}


//主要转发接口
export async function whisper(request: Request, response: Response, next?: NextFunction) {
    try {
        whisperDo(request, response, next)
    } catch (e) {
        mlog('error', 'top.whisper.error', e)
    }
}
async function whisperDo(request: Request, response: Response, next?: NextFunction) {

    const clientId = generateRandomCode(16);
    const newClient = {
        id: clientId, response
    };
    request.on('close', () => {
        //console.log(`${clientId} Connection closed`);
        //clients = clients.filter(client => client.id !== clientId);
    });
    let tomq = { header: request.headers, request: { model: request.body.model, duration: 0 }, response: '', reqid: clientId, status: 200, myKey: '', stime: Date.now(), etime: 0, user: {} }
    let url = isNotEmptyString(process.env.SSE_API_BASE_URL) ? process.env.SSE_API_BASE_URL : 'https://api.openai.com';
    let uri = request.headers['x-uri'] ?? '/v1/audio/transcriptions';
    const req = request;
    const res = response;
    if (!req.file || !req.file.buffer) {
        //res.status(400).json({'error':'uploader fail'});

        publishData("openapi", 'error', JSON.stringify({ e: { error: 'buffer error file not uploader ' }, tomq }));
        //response.writeHead( 400 ).end( JSON.stringify( {error:'buffer error file not uploader '}));
        response.writeHead(428).end(`{"error":{"message":"please upload file ","type":"openai_hk_error","code":"file_null"}}`);

        return;
    } else {
        try {
            const fileBuffer = req.file.buffer;
            const formData = new FormData();
            formData.append('file', fileBuffer, { filename: req.file.originalname });
            formData.append('model', req.body.model);

            //获取key
            const mykey = await getMyKey(request, 'gpt'); //request.headers['authorization'], request.body
            tomq.myKey = mykey.key;
            tomq.user = mykey.user;
            //验证IP百名单 
            //await checkWhileIp( +mykey.user.uid,request );

            let rqUrl = mykey.apiUrl == '' ? url + uri : mykey.apiUrl + uri;
            let model = req.body.model
            try {
                let mp3 = await mp3time(fileBuffer);
                tomq.request.duration = mp3.duration;
            } catch (e3) {
                publishData("openapi", 'error', JSON.stringify({ e: { error: '获取时间识别 ' }, tomq }));
                response.writeHead(428).end(`{"error":{"message":"mp3 time error","type":"openai_hk_error","code":"mp3_time_error"}}`);
                return;
            }


            mlog("log", '请求>>', rqUrl, mykey.user?.uid, model, mykey.user?.fen, tomq.myKey, tomq.request.duration);

            let responseBody = await axios.post(rqUrl, formData, {
                headers: {
                    Authorization: tomq.myKey,
                    'Content-Type': 'multipart/form-data'
                }
            });
            // console.log('responseBody', responseBody.data  );
            res.json(responseBody.data);
            tomq.response = JSON.stringify(responseBody.data);

        } catch (error) {
            if (error.response) {
                let e = error.response;
                let data = error.response.data
                console.log('error>>', data)
                response.writeHead(e.status ?? 428);
                publishData("openapi", 'error', JSON.stringify({ e: { status: e.status, data }, tomq }));
                if (data) response.end(JSON.stringify(data).replace(/one_api_error/ig, 'openai_hk_error'));
                else {
                    response.end(`{"error":{"message":"error","type":"openai_hk_error","code":"gate_way_error"}}`);
                }
                return;
                //response.write(`data: ${ e.reason}\n\n`);
            }
            else if (error.status) {
                publishData("openapi", 'error', JSON.stringify({ e: error, tomq }));
                response.writeHead(error.status).end(error.reason);
            }
            else {
                let e = error;
                response.writeHead(428);
                //response.end("get way error...\n"  );
                let ss = e.reason ?? 'gate way error...';
                response.end(`{"error":{"message":"${ss}","type":"openai_hk_error","code":"gate_way_error"}}`);
                console.log('error gate>>', ss)
                publishData("openapi", 'error', JSON.stringify({ e: { status: 428, reason: e }, tomq }));
                return;
            }
        }

        console.log("finish", request.headers['authorization'])
        tomq.etime = Date.now();
        publishData("openapi", 'finish', JSON.stringify(tomq));
        response.end();



    }

}

const mp3time = (buffer: any) => {
    return new Promise<{ duration: number }>((resolve, reject) => {
        mp3Duration(buffer, (err, duration) => {
            if (err) {
                //return res.status(500).send('无法获取时长');
                reject({ error: '无法获取时长' });
            }
            resolve({ duration });


            //res.send(`MP3文件时长为 ${duration} 秒`);
        });
    })

}

export async function sse(request: Request, response: Response, next?: NextFunction) {
    try {
        sseDo(request, response, next)
    } catch (e) {
        mlog('error', 'top.sse.error', e)
    }
}
async function sseDo(request: Request, response: Response, next?: NextFunction) {

    let headers = {
        //'Content-Type': 'text/event-stream',
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };


    let isGo = false;
    const clientId = generateRandomCode(16);
    const newClient = {
        id: clientId, response
    };
    request.on('close', () => {
        mlog(`${clientId} Connection closed`);
        //clients = clients.filter(client => client.id !== clientId);
    });

    let tomq = { header: request.headers, request: request.body, response: '', reqid: clientId, status: 200, myKey: '', stime: Date.now(), etime: 0, user: {} }
    let endStr = null;
    //console.log( 'request.headers',  request.headers );
    //console.log( 'request.body',  request.body );
    let url = isNotEmptyString(process.env.SSE_API_BASE_URL) ? process.env.SSE_API_BASE_URL : 'https://api.openai.com';

    let uri = request.headers['x-uri'] ?? '/v1/chat/completions'



    try {
        const model = request.body.model ?? '';

        if (request.body && request.body.stream == true) {
            headers['Content-Type'] = 'text/event-stream'; //为了 适配fastcgi
        }
        const isTTS = model.indexOf('tts-') === 0
        if (isTTS) {
            headers['Content-Type'] = 'audio/mpeg';
            uri = '/v1/audio/speech';
        }
        //获取key
        const mykey = await getMyKey(request, 'gpt'); //request.headers['authorization'], request.body
        tomq.myKey = mykey.key;
        tomq.user = mykey.user;
        //验证IP百名单
        //await checkWhileIp( +mykey.user.uid,request );
        // console.log('请求>>', uri,  mykey.user?.uid, mykey.user?.fen,tomq.myKey , mykey.apiUrl );

        let rqUrl = mykey.apiUrl == '' ? url + uri : mykey.apiUrl + uri;
        if (model == 'midjourney') {
            rqUrl = 'https://mj2chat.ccaiai.com' + uri;
            tomq.myKey = 'sk-mj2chatmidjourney';
        }

        mlog('log', '请求>>', rqUrl, mykey.user?.uid, model, mykey.user?.fen, tomq.myKey);
        // mlog('body',  request.body );
        if (isTTS) {
            const reps = await fetch(rqUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: tomq.myKey
                },
                body: JSON.stringify(request.body),
            });

            if (!reps.ok) {
                response.writeHead(reps.status);
                let e = { reason: `Failed to generate speech: ${reps.statusText}` }
                response.end(e.reason);
                publishData("openapi", 'error', JSON.stringify({ e, tomq }));
            }

            const arrayBuffer = await reps.arrayBuffer();
            const audioBuffer = Buffer.from(arrayBuffer);
            response.set('Content-Type', 'audio/mpeg');
            response.send(audioBuffer);
            tomq.response = JSON.stringify({ 'len': audioBuffer.length })

        } else {
            await fetchSSE(rqUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: tomq.myKey
                },
                onMessage(data) {
                    if (!isGo) response.writeHead(200, headers);
                    isGo = true;
                    //console.log('onMessage>>', data )
                    //response.write(`data: ${ data}\n\n`);
                    response.write(data);
                    tomq.response += data;

                },
                onError(e) {
                    console.log('onError>>', e);
                    response.writeHead(e.status);
                    response.end(e.reason);
                    publishData("openapi", 'error', JSON.stringify({ e, tomq }));
                    //endStr=e.reason;
                },
                body: JSON.stringify(request.body)
            });
        }
    } catch (e) {
        //console.log('error big>>' )
        //response.send(2)
        try {
            if (e.status) {

                console.log('error big3>>')
                publishData("openapi", 'error', JSON.stringify({ e, tomq }));
                response.writeHead(e.status);
                response.end(e.reason?.replace(/one_api_error/ig, 'openai_hk_error'));
                return;
                //response.write(`data: ${ e.reason}\n\n`);
            }
            else {
                publishData("openapi", 'error', JSON.stringify({ e: { status: 428, reason: e }, tomq }));
                response.writeHead(428);
                //response.end("get way error...\n"  );
                let ss = e.reason ?? 'gate way error...';
                response.end(`{"error":{"message":"${ss}","type":"openai_hk_error","code":"gate_way_error"}}`);
                if (e.reason) mlog("error", 'error big2>>', ss)
                else console.log('error no reason>>', e)

                return;
            }
        } catch (e3) {
            mlog("error", " response.writeHead")
        }
    }

    try {
        mlog("log", "finish", request.headers['authorization'])
        tomq.etime = Date.now();
        publishData("openapi", 'finish', JSON.stringify(tomq));
        response.end();
    } catch (e3) {
        mlog("error", "response.end")
    }
}


export function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

export const sseDoTimeOut = async (request: Request, response: Response, next?: NextFunction) => {
    let headers = {
        //'Content-Type': 'text/event-stream',
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    let rqUrl = 'https://api.openai-hk.com/v3/test?q=' + request.query.q
    let isGo = false
    console.log('onMessage>> q ', request.query.q)
    await fetchSSE(rqUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // Authorization:  tomq.myKey
        },
        onMessage(data) {
            if (!isGo) response.writeHead(200, headers);
            isGo = true;
            console.log('onMessage>>', data)
            //response.write(`data: ${ data}\n\n`);
            response.write(data);
            //tomq.response+= data;

        },
        onError(e) {
            console.log('onError>>', e);
            response.writeHead(e.status);
            response.end(e.reason);
            //publishData( "openapi", 'error',  JSON.stringify({e,tomq} ));
            //endStr=e.reason;
        }
        //,body: JSON.stringify( request.body)
    });
    console.log('end >>')
    response.end();
}