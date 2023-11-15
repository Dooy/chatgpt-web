
import "reflect-metadata"
import { isString } from "src/utils/is";
import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column,Index } from "typeorm"
import { mlog } from "../utils";
import { getSess } from "./connect";
const C2API_SERVER= process.env.C2API_SERVER
const C2API_BASE_URL=  process.env.C2API_BASE_URL

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("int")
  @Index("status")
  status: number;



  @Column("int")
  @Index("isPlus")
  isPlus: number;

  


//   @Column("text")
//   createTime?: string;

//   @Column("text")
//   updateTime?: string;


//   @Column("text")
//   deleted_at?: string;

  @Column("text")
  email: string;
  
  @Column("int")
  @Index("useTime")
  useTime: number;

  @Column({type:'text',  nullable: true })
  cookie?: string;
  
//   @Column("text")
//   officialSession: string;
  
//   @Column("text")
//   remark?: string; 
}

export const SessionRepository = async ()=>{
    const connection = await getSess();
    return connection.getRepository( Session )
}


@Entity()
export class Cache { 
  @PrimaryColumn("text")
  key: string;

  @Column("text")
  value: string;

  
}

export const CachseRepository = async ()=>{
    const connection = await getSess();
    return connection.getRepository( Cache )
}

export const getApiKey = async ()=>{
    const updatetime = await getCache('updatetime')
   
    
     //await initAccount();
    if( updatetime==null ) await initAccount();
    else if( Date.now()-(+updatetime)>600*1000 )initAccount();

    let  onekey = await getOneKey();
     if(onekey.cookie! || onekey.cookie=='' ){
        onekey= await login(onekey);
     }
   
    //mlog('onekey', onekey );
    return onekey;//`${onekey.id}---${onekey.email}`;
}
const login= async (one:Session)=>{
    let sk= `api::${one.id}::${one.email}`; //'helloworld';//
    const d= await fetch(`${C2API_BASE_URL}/login`, {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "zh-CN,zh;q=0.9",
            "cache-control": "max-age=0",
            "content-type": "application/x-www-form-urlencoded",
            "proxy-connection": "keep-alive",
            "upgrade-insecure-requests": "1",
            
        },
        "referrer": `${C2API_BASE_URL}`,
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": `password=${ sk }&action=default`,
        "method": "POST",
        "mode": "cors",
        "credentials": "include",
        redirect: 'manual' //不跟随才能取到cookie
        });
   
   let ck=  d.headers.get('set-cookie');
   mlog('log','登录成功！', sk , ck );
   if( ck ){
      const rep= await SessionRepository();
      one.cookie= ck;
      rep.save(one);
      return one;
   }
   throw('登录出问题了！');
   //throw  ("cookie:"+d.status+':' + JSON.stringify(     d.headers.get('set-cookie') )  );
   //throw("未初始化账号或者未添加账号！"); 
}

export const updateSession = (onekey:Session)=>{
    SessionRepository().then( dbRep=>dbRep.save(onekey)).catch(eee=>mlog(eee));
    if( onekey.status==0){
        fetch(`${C2API_SERVER}/xy/api/modify/${onekey.id}`, {body:JSON.stringify({status:0}) })
        .then(()=>mlog('log', onekey.id,onekey.email, '远程更新状态status' )).catch(ee=>mlog(ee));
    }
}
const getOneKey= async ()=>{
    // const connection= await getSess();
    //const row = await connection.manager.findOneBy(Session,{status:1});
    const req = await SessionRepository();
    const row = await req.findOne({where:{status:1},order:{useTime:'ASC'}});
    if( !row) throw("未初始化账号或者未添加账号！");
    row.useTime= Date.now();
    req.save( row)
    return row;
}
const initAccount=async ()=>{
   
    try {
         const d= await fetch(`${C2API_SERVER}/xy/api/allid/?display=json`);//.then(d=>d.json().then(f) );
        const json = await d.json();
        const accounts= json.data.accounts as any[];
        //const connection= await getSess();
        const userRepository =await SessionRepository();
       
        //accounts.map( async (v)=> {
        for (let v of accounts){
            const nSec = new Session();
            nSec.id = +v.id; 
            nSec.status = +v.status; 
            nSec.email = v.email; 
            nSec.isPlus = +v.isPlus; 
             
            // nSec.officialSession=  ""; 
            nSec.useTime =  1000*Math.random(); 
            await userRepository.save( nSec ); 
        }
        await setCache('updatetime',`${Date.now()}`);
        //})
        //json.data.accounts.m
    } catch (error) {
         throw("初始化账号错误！");
    }
}
export const getCache= async(key:string)=>{
    //const rep  =await CachseRepository();
    const connection= await getSess();
    const [row]  = await connection.manager.findBy(Cache,{key});
    if(!row) return null;
    return row.value;
}
export const setCache= async(key:string,value:string|object )=>{
    let v= isString( value)?value:JSON.stringify( value);
    const rep  =await CachseRepository();
    const n= new Cache();
    n.key=key;n.value=v;
    await rep.save(n);
    mlog("有保存上么？", key )
}


  