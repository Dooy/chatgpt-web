import Connection, { Channel } from 'rabbitmq-client'
let  rabbit:Connection, ch:Channel;
async function createRabbitMQChannel() {
    rabbit = createRabbitMQ();
    ch = await rabbit.acquire();
    ch.on('close', () => {
        console.log('channel was closed')
    });
    return ch ;
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
    await createRabbitMQChannel();
    //await ch.queueDeclare({queue , exclusive: true}) 
    await ch.basicPublish({routingKey,exchange}, data) 
    await closeMq();
}
async function closeMq(){
    await ch.close();
    await rabbit.close();
}