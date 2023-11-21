## 接入点
8091 是到chat.openai.com
8092 是到 https://demo.xyhelper.cn 接入点的
```shell
##请到hw机器上 
cd /data/app/chatgpt-web/docker-compose/chat2api-point && git pull 
cd /data/app/chatgpt-web/docker-compose/chat2api-point && git pull
docker build -t chatpoint . && docker tag chatpoint ydlhero/chatpoint && docker push  ydlhero/chatpoint

docker pull  ydlhero/chatpoint
docker rm -f  chatpoint && docker run --name chatpoint  -itd  --restart=always  -p 80:8091  -p 8092:8092  -p 8099:8099  ydlhero/chatpoint

docker rm -f  chatpoint && docker run --name chatpoint  -itd  --restart=always  -p 6091:8091  -p 8092:8092  -p 8099:8099 ydlhero/chatpoint
```