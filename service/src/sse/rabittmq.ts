 import { Channel,Connection } from 'rabbitmq-client'
let  rabbit:Connection, ch:Channel;
async function createRabbitMQChannel() {
    rabbit = createRabbitMQ();
    ch = await rabbit.acquire();
    ch.on('close', () => {
        console.log('channel was closed')
    });
    return ch ;
}

async function createRabbitMQChannelReal() {
    const r = createRabbitMQ();
    const c = await r.acquire();
    c.on('close', () => {
        console.log('channel was closed')
    });
    return {r,c} ;
}

function createRabbitMQ(){
    const r= new Connection({
    url:   <string>process.env.SSE_MQ_SERVER, 
    retryLow: 1000,
    retryHigh: 30000,
    });
    r.on('error', (err) =>    console.error('rabbit>>',err)  )
    r.on('connection', () =>   console.log('The connection is successfully (re)established') )
    return r;
}

export async function publishData( exchange:string,routingKey:string, data:string) {
   
    //await ch.queueDeclare({queue , exclusive: true}) 
    console.log('publishData>>',exchange,routingKey )
    try{
        const mq = await createRabbitMQChannelReal();
        await mq.c.basicPublish({routingKey,exchange}, data) 
        await mq.c.close();
        await mq.r.close();
    }catch(e ){
         //console.error('publishData 发生错误>>', e  )
        await  publishData_bak(exchange,routingKey, data );
    }
}
async function publishData_bak( exchange:string,routingKey:string, data:string) {
   
    //await ch.queueDeclare({queue , exclusive: true}) 
    console.log('publishData_bak>>',exchange,routingKey )
    try{
        await createRabbitMQChannel();
        await ch.basicPublish({routingKey,exchange}, data) 
        await closeMq();
    }catch(e ){
         console.error('publishData_bak 发生错误>>', e  )
    }
}

async function closeMq(){
    await ch.close();
    await rabbit.close();
}