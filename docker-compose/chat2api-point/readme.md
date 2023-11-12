## 接入点
```shell
docker build -t chatpoint . && docker tag chatpoint ydlhero/chatpoint && docker push  ydlhero/chatpoint

docker pull  ydlhero/chatpoint
docker rm -f  chatpoint && docker run --name chatpoint  -itd  --restart=always  -p 2080:80  ydlhero/chatpoint
```