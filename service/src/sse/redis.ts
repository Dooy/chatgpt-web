import { createClient, RedisClientType } from 'redis'
import { isNotEmptyString } from '../utils/is'
import * as dotenv from 'dotenv'
import { mlog } from './utils';
 dotenv.config() 

let hRedis:RedisClientType ;
export function createRedis():Promise<RedisClientType> {
    const REDIS_URL= isNotEmptyString(process.env.SSE_REDIS_URL)?process.env.SSE_REDIS_URL:'redis://localhost:6379'
    return new Promise((h,r)=>{
       // if( hRedis && hRedis.isOpen ) return h(hRedis) ;
        let client:RedisClientType =  createClient({
            url:  REDIS_URL,
        });
        client.on('error', err =>r(err));
        client.connect().then(()=>{ 
            mlog('createRedis' , REDIS_URL );
            hRedis = client;
            h(client)
        }).catch(err=>r(err));
    });
    
}