## 代理模式

环境变量必须填

```
#远程代理服务器可以直接用 https://api.openai.com 
SSE_API_BASE_URL=http://43.154.202.174:6008

# redis server
SSE_REDIS_URL='redis://127.0.0.1:6379'
#mq server
SSE_MQ_SERVER= amqp://user:passwd@mq.server.com:5672
 
#HTTP_SERVER 自己的服务地址 
SSE_HTTP_SERVER=http://127.0.0.1
```

heder 接收的数据有

x-uri 要转发的路径 可以转由NGINX 过来

## 启动docker

```
docker rm -f sse3064
docker run --name sse3064 -d -p 3064:3002  --restart=always \
 --env OPENAI_API_KEY=hk-wXiL2SMN4D7GBqFhBsYdT3BlbkFJhwEHGXbU5RzCM8dS3lrn  \
 --env TIMEOUT_MS=60000 -e SSE_API_BASE_URL=https://aip.openai-sk.com \
-e SSE_REDIS_URL=redis://172.17.0.1:6379 \
-e SSE_MQ_SERVER=amqp://mj:mj2023@172.17.0.1:5672 \
-e SSE_HTTP_SERVER=https://www.aidutu.cn \
ydlhero/chatui:sse65

```

## 消费 

> https://github.com/Dooy/midjourney-discord/tree/main/mq-consumer