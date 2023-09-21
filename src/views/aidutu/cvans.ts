 class CavansDemo {
            /**
             * @description: 构造函数 
             * @param {*} canvasId 要操作的canvasid
             * @param {*} drawColor 绘制颜色
             * @param {*} imageUrl  背景图片url
             * @return {*}
             */
            constructor(canvasId, drawColor, imageUrl) {
                this.oCanvas = document.getElementById(canvasId);
                this.ctx = this.oCanvas.getContext("2d");
                this.imageUrl = imageUrl;
                this.drawColor = drawColor;
                this.oShape = null;
                this.bDrawState = false; // 绘制状态默认false
                this.bDragState = false; // 拖拽状态默认true
                // 初始化图片对象
                this.initImage();

                // 绑定鼠标事件
                // 鼠标按下事件
                this.oCanvas.addEventListener('mousedown', (e) => {
                    this.canvasMouseDown(e);
                });
                // 鼠标移动事件
                this.oCanvas.addEventListener('mousemove', (e) => {
                    this.canvasMouseMove(e);
                });
                // 鼠标抬起事件
                this.oCanvas.addEventListener('mouseup', (e) => {
                    this.canvasMouseUp(e);
                });
            }


            /**
             * @description: 初始化图片对象
             */
            initImage() {
                this.oImage = new Image();
                this.oImage.src = this.imageUrl;
                this.oImage.onload = () => {
                    // load完毕回调，将图片平铺全覆盖绘制在画板上
                    this.drawBackgroundImage();
                    // console.log('image loaded');
                    //console.log("width : " + this.oImage.width + ", height : " + this.oImage.height);
                }
            }

            /**
             * @description: 绘制背景图片
             */
            drawBackgroundImage() {
                if (this.oImage) {
                    this.ctx.clearRect(0, 0, this.oCanvas.width, this.oCanvas.height);
                    this.ctx.drawImage(this.oImage, 0, 0, this.oCanvas.width, this.oCanvas.height);
                }
            }

            /**
             * @description: 鼠标在canvas上按下事件
             * @param {*} e 鼠标事件
             * @return {*}
             */
            canvasMouseDown(e) {
                let mousePos = this.getCanvasMousePos(e);
                console.log('down ' + JSON.stringify(this.getCanvasMousePos(e)));
                if (!this.oShape) { // 为空说明没画,然后进入绘制逻辑
                    this.bDrawState = true;
                    // 鼠标开始的位置
                    this.oShape = {
                        startX: mousePos.x,
                        startY: mousePos.y
                    }
                } else { // 已经绘制了，那么进入拖拽逻辑
                    if (!this.isMouseInShape(mousePos)) {
                        // 鼠标没点到矩形区域，不操作
                        return;
                    }
                    this.bDragState = true;
                    // 记录开始拽的位置
                    this.oShape.oStartDragPos = {
                        x: mousePos.x,
                        y: mousePos.y
                    }
                }
            }


            /**
             * @description: 画矩形
             */
            drawRect() {
                if (this.oShape) {
                    this.ctx.clearRect(0, 0, this.oCanvas.width, this.oCanvas.height);//清除画板
                    this.drawBackgroundImage(); // 背景图重绘
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.oShape.startX, this.oShape.startY);
                    this.ctx.fillStyle = this.drawColor;
                    this.ctx.fillRect(this.oShape.startX, this.oShape.startY, this.oShape.endX - this.oShape.startX,
                        this.oShape.endY - this.oShape.startY);
                    this.ctx.closePath();
                }
            }

            /**
             * @description: 鼠标在canvas上抬起事件
             * @param {*} e 鼠标事件
             * @return {*}
             */
            canvasMouseUp(e) {
                // 鼠标抬起视为操作结束
                this.bDrawState = false;
                this.bDragState = false;

                console.log('up ' + JSON.stringify(this.getCanvasMousePos(e)));
            }

            /**
             * @description: 鼠标在canvas上移动事件
             * @param {*} e 鼠标事件
             * @return {*}
             */
            canvasMouseMove(e) {
                let mousePos = this.getCanvasMousePos(e);
                console.log('move ' + JSON.stringify(this.getCanvasMousePos(e)));
                if (this.oShape && this.bDrawState) {
                    // 鼠标结束的位置
                    this.oShape.endX = mousePos.x;
                    this.oShape.endY = mousePos.y;
                    this.drawRect();
                }

                if (this.oShape && this.bDragState) {
                    // 计算开始拽的地方，到鼠标移动后的位置的偏移量
                    let offset = {
                        x: mousePos.x - this.oShape.oStartDragPos.x,
                        y: mousePos.y - this.oShape.oStartDragPos.y
                    }

                    // 将画的rect图像，同时左边偏移同样的量
                    this.oShape.startX += offset.x;
                    this.oShape.startY += offset.y;
                    this.oShape.endX += offset.x;
                    this.oShape.endY += offset.y;

                    // 重新绘制
                    this.drawRect();

                    // 然后将拖拽的oStartDragPos位置重置为最终鼠标的位置
                    this.oShape.oStartDragPos.x = mousePos.x;
                    this.oShape.oStartDragPos.y = mousePos.y;
                }
            }

            /**
             * @description: 鼠标坐标转换,将鼠标点的位置，转换为canvas元素内部点击的位置
             * @param {*} e 鼠标事件
             * @return {*}
             */
            getCanvasMousePos(e) {
                let rect = this.oCanvas.getBoundingClientRect();
                let x = (e.clientX - rect.left) * this.oCanvas.width / rect.width;
                let y = (e.clientY - rect.top) * this.oCanvas.height / rect.height;

                return {
                    'x': x,
                    "y": y
                }
            }

            // 判断鼠标是否在绘制的矩形区域内
            isMouseInShape(e) {
                this.ctx.beginPath();
                this.ctx.rect(this.oShape.startX, this.oShape.startY, this.oShape.endX - this.oShape.startX,
                    this.oShape.endY - this.oShape.startY);
                return this.ctx.isPointInPath(e.x, e.y);
            }

}

export {CavansDemo} ;