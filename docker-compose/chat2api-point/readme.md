## 接入点

```shell
##请到hw机器上 
cd /data/app/chatgpt-web/docker-compose/chat2api-point && git pull 
cd /data/app/chatgpt-web/docker-compose/chat2api-point && git pull
docker build -t chatpoint . && docker tag chatpoint ydlhero/chatpoint && docker push  ydlhero/chatpoint

docker pull  ydlhero/chatpoint
docker rm -f  chatpoint && docker run --name chatpoint  -itd  --restart=always  -p 80:8091  ydlhero/chatpoint
```