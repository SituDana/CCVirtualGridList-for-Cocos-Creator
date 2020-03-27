var VirtualGridList = cc.Class({
    extends: cc.Component,

    ctor() {
        this.selectedItemData;
    },

    properties: {
        itemTemplatePrefab: cc.Prefab, // item
        itemComponentName: cc.String, // itemCtrl脚本名字
        paddingTop: 0, // item 距离上边缘距离
        paddingBottom: 0, // item 距离下边缘距离
        spacingX: 3, // item 列间距 编辑器属性面板设置
        spacingY: 3, // item 行间距 编辑器属性面板设置
        columnNum: 0, // 列数 编辑器属性面板设置
        useVirtualLayout: true, // 是否启用虚拟列表
        cacheImage: true, // 缓存加载的图片
        lbEmptyTip: cc.Label, // 没有数据显示提示

        _spawnCount: 0, // 常驻绘制数量
        _totalCount: 0, // 总共数量
        _bufferZone: 0, // 缓冲区域(包括屏幕内)
        _gridList: null, // cc.ScrollView组件
        _content: null, // cc.ScrollView.content
        _lastContentPosY: 0, // 上一次滚动位置
        _itemHeight: 0, // item template 高度
        _itemWidth: 0, // item template 宽度

        _imgLoadingList: null, //要加载的图片列表
        _imgLoading: false, //图片列表是否在加载中
        _loadImgDuration: 1, // 帧内加载最大时长
        _imgMap: null, // 加载后的图片缓存
        _initialized: false, //初始化完成

        _scrollToBottomHandler: null, //滑动到底部回调事件
        _scrollToBottomThisObj: null, //滑动到底部回调事件this对象
        _selectOneItemHandler: null,    // 选中回调事件
        _selectOneItemThisObj: null,    // 选中事件this 对象
        _dataList: null, // 数据列表
        _items: null, // 显示列表items
    },

    /**
     * 获取显示列表
     * @returns {Array<cc.Prefab>}
     */
    getTemplateItems() {
        return this._items;
    },

    /**
     *  获取数据队列
     * @returns {Array<any>}
     **/
    getDataList() {
        return this._dataList;
    },

    /**
     * 通过初始化方法传参的方式，初始化滚动列表，建议在画面的onLoad方法中调用，
     * 相比在creator界面中设置参数，这种方式更易维护，不会因为与VirtualGridList控件保持同步而导致配置丢失或者重置。
     * @param {cc.Prefab} itemTemplatePrefab 
     * @param {String} itemComponentName 
     * @param {{paddingTop?: Number,
        paddingBottom?: Number,
        spacingX?: Number,
        spacingY?: Number,
        columnNum?: Number,
        useVirtualLayout?: Boolean,
        emptyTip?: cc.String
        cacheImage?: Boolean}} options

     *  paddingTop: 列表距离上边缘距离 默认为0
        paddingBottom: 列表距离下边缘距离 默认为0
        spacingX: 列间距 默认为3
        spacingY: 行间距 默认为3
        columnNum: 列数 默认为0，自动适配容器宽度
        useVirtualLayout: 是否启用虚拟列表 默认为true
        emptyTip: 没有数据显示提示
        cacheImage: 缓存列表中加载过的图片，控件回收后，图片缓存将被全部释放。
     */
    initGridList(itemTemplatePrefab, itemComponentName, options) {
        this._gridList = this.node.getComponent(cc.ScrollView);
        this._content = this._gridList.content;

        this.itemTemplatePrefab = itemTemplatePrefab;
        this.itemComponentName = itemComponentName;
        if (options) {
            this.paddingTop = options.paddingTop === undefined ? this.paddingTop : options.paddingTop;
            this.paddingBottom = options.paddingBottom === undefined ? this.paddingBottom : options.paddingBottom;
            this.spacingX = options.spacingX === undefined ? this.spacingX : options.spacingX;
            this.spacingY = options.spacingY === undefined ? this.spacingY : options.spacingY;
            this.columnNum = options.columnNum === undefined ? this.columnNum : options.columnNum;
            this.useVirtualLayout = options.useVirtualLayout === undefined ? this.useVirtualLayout : options.useVirtualLayout;
            this.emptyTip = options.emptyTip === undefined ? this.emptyTip : options.emptyTip;
            this.cacheImage = options.cacheImage === undefined ? true : this.cacheImage;
            this.lbEmptyTip.getComponent(cc.Label).string = this.emptyTip;
        }

        // 延时为了自适应宽度
        this.scheduleOnce(this._initializeList, 0);
    },

    /**
     * 初始化布局
     */
    _initializeList() {
        // this._gridList = this.node.getComponent(cc.ScrollView);
        // this._content = this._gridList.content;
        this._itemHeight = this.itemTemplatePrefab.data.height;
        this._itemWidth = this.itemTemplatePrefab.data.width;
        if (this.columnNum == 0) {
            // 自动计算
            this.columnNum = Math.floor((this._content.width + this.spacingX) / (this._itemWidth + this.spacingX));
            if (this.columnNum < 1) {
                this.columnNum = 1;
            }
        }

        if (this.useVirtualLayout) {
            this.node.on('scrolling', this._onVirtualLayoutScrolling, this);
        } else {
            // this.node.on('scrolling', this._onScrolling, this);
        }
        // 缓冲区域，半屏加1个item高度
        this._bufferZone = this.node.height * 0.5 + this._itemHeight;

        // 计算出需要同时绘制的数量(一屏数量 + 二行(上下各一行))
        this._spawnCount = Math.ceil(this.node.height / this._itemHeight + 2) * this.columnNum;

        this._lastContentPosY = 0;
        this._initialized = true;

        // 数据列表可能在初始化完成之前进入
        if (this._dataList) {
            this.createItemsDisplayList(this._dataList);
        }
    },

    /**
     * 创建物品格子列表
     * @param {Array<any>} dataList 数据
     */
    createItemsDisplayList(dataList) {
        this._dataList = dataList = dataList || [];
        if (!this._initialized) {
            return;
        }
        let content = this._content || this._gridList.content;
        content.destroyAllChildren();
        // 总数量
        this._totalCount = dataList.length;
        // 设置content总高度
        content.height = this._getContentHeight(this._totalCount);
        // 创建固定数量
        this._createFixedIncrementItems();

        if (!this.isTop()) {
            this.scheduleOnce(() => {
                this.scrollToTop();
            }, .2);
        }

        if (this._totalCount > 0) {
            this.lbEmptyTip.node.active = false;
        } else {
            this.lbEmptyTip.node.active = true;
        }
    },

    /**
     * 追加数据列表，一般用于滚动翻页
     * @param {Array<any>} dataList 追加数据队列
     */
    appendItemsToDisplayList(dataList) {
        if (!dataList || dataList.length <= 0) {
            return;
        }
        if (this._totalCount <= 0) {
            this.createItemsDisplayList(dataList);
            return;
        }
        dataList = this._dataList.concat(dataList);
        if (this._totalCount < this._spawnCount) {
            // 不满一屏的时候，重新绘制新列表
            this.createItemsDisplayList(dataList);
        } else {
            let content = this._content || this._gridList.content;
            // 总数量
            this._totalCount = dataList.length;
            // 设置content总高度
            content.height = this._getContentHeight(this._totalCount);
            // // 创建固定数量
            // this._createFixedIncrementItems(this._dataList.length);
            this._dataList = dataList;

            if (this._totalCount > 0) {
                this.lbEmptyTip.node.active = false;
            } else {
                this.lbEmptyTip.node.active = true;
            }
            this.scheduleOnce(() => {
                let pos = this._gridList.getScrollOffset();
                pos.y += this._itemHeight * .2;
                this._gridList.scrollToOffset(pos, .1);
            });
        }
    },

    onLoad() {

    },

    /**
     * 注册滚动至底部回调方法
     * @param {Function} handler 滚动至底部回调函数 function()
     * @param {*} thisObj 回调函数this对象
     */
    addScrollToBottomEventHandler(handler, thisObj) {
        this._scrollToBottomHandler = handler;
        this._scrollToBottomThisObj = thisObj;
    },

    /**
     * 选中事件回调方法
     * @param {Function} handler 选中事件回调函数 function()
     * @param {*} thisObj 回调函数this对象
     */
    addSelectOneItemEventHandler(handler, thisObj) {
        this._selectOneItemHandler = handler;
        this._selectOneItemThisObj = thisObj;
    },

    /**
     * 刷新列表显示, 条数不变，修改数据，刷新显示
     * @param {any[]} some 刷新指定单元
     */
    refreshItemDisplays(some) {
        if (this._items) {
            let list = this._items;
            let item;
            let comName = this.itemComponentName;
            if (some && some.length > 0) {
                for (let i = 0; i < list.length; i++) {
                    item = list[i];
                    if (some.indexOf(item.getComponent(comName).data) != -1)
                        item.getComponent(comName).dataChanged();
                }
            } else {
                for (let i = 0; i < list.length; i++) {
                    item = list[i];
                    item.getComponent(comName).dataChanged();
                }
            }
            item = null;
            list = null;
        }
    },

    _onVirtualLayoutScrolling() {
        let items = this._items;
        const buffer = this._bufferZone;
        const isDown = this._content.y < this._lastContentPosY; // 滚动方向 下减上加
        const offset = (this._itemHeight + this.spacingY) * Math.ceil(items.length / this.columnNum); // 所有items 总高度
        let dataList = this._dataList;
        let comName = this.itemComponentName;

        // 更新每一个item位置和数据
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let viewPos = this._getPositionInView(item);

            if (isDown) {
                // 往下滑动，看下面的item，超出屏幕外下方，但是没有到top的item
                if (viewPos.y < -buffer && item.y + offset < 0) {
                    let itemCtrl = item.getComponent(comName);
                    itemCtrl.onLeave();
                    item.y = item.y + offset;
                    let itemIndex = itemCtrl.getItemIndex() - items.length;
                    itemCtrl.updateItem(dataList[itemIndex], itemIndex);
                    itemCtrl.dataChanged();
                    itemCtrl.onEnter();
                }
            } else {
                // 往上滑动，看上面的item，超出屏幕外上方，但是没有到bottom的item
                if (viewPos.y > buffer && item.y - offset > -this._content.height) {
                    let itemCtrl = item.getComponent(comName);
                    let itemIndex = itemCtrl.getItemIndex() + items.length;
                    // 大于总数量的不移动更新
                    if (itemIndex < this._totalCount) {
                        itemCtrl.onLeave();
                        item.y = item.y - offset;
                        itemCtrl.updateItem(dataList[itemIndex], itemIndex);
                        itemCtrl.dataChanged();
                        itemCtrl.onEnter();

                        if (itemIndex === this._totalCount - 1) {
                            this._onScrollToBottom();
                        }
                    }
                }
            }
        }
        // 保存最后一次contentY偏移量，判断滑动方向
        this._lastContentPosY = this._content.y;
        items = null;
        dataList = null;
    },

    /**
     * 滚动到底部触发
     */
    _onScrollToBottom() {
        if (this._scrollToBottomHandler) {
            this._scrollToBottomHandler.call(this._scrollToBottomThisObj);
        }
    },

    _onSelectOneItem(data){
        if (this._selectOneItemHandler) {
            this._selectOneItemHandler.call(this._selectOneItemThisObj, data);
        }
    },

    /**
     * 创建固定增量的items
     * @param {Number} startIndex 起始索引
     */
    _createFixedIncrementItems(startIndex) {
        let items = this._items = [];
        startIndex = startIndex || 0
        // 如果总数量不足够同时创建的数量，则只创建总数量
        let fixCount = this._totalCount;
        if (this.useVirtualLayout) {
            fixCount = this._totalCount < this._spawnCount ? this._totalCount : this._spawnCount;
        }
        let dataList = this._dataList;
        let comName = this.itemComponentName;
        for (let i = startIndex; i < fixCount; i++) {
            let item = this._createOneItemDisplay(i, dataList[i]);
            items.push(item);
        }
        dataList = null;
        if (items.length > 0) {
            this.scheduleOnce(() => {
                for (let i = 0; i < items.length; i++) {
                    items[i].getComponent(comName).dataChanged();
                }
                items = null;
            })
        }
    },

    /**
     * 创建一个item
     * @param {Number} idx 索引
     * @param {*} item data
     * @returns {cc.Prefab} 返回一个显示单元
     */
    _createOneItemDisplay(idx, data) {
        let item = cc.instantiate(this.itemTemplatePrefab);
        this._content.addChild(item);
        // 更新位置
        this._updateItemPos(item, idx);
        // 更新id 
        let component = item.getComponent(this.itemComponentName);
        component.updateItem(data, idx);
        component.virtualGridList = this;

        item.on(cc.Node.EventType.TOUCH_END, this._onItemTouched, this);
        return item;
    },

    /**
     * 显示单元被点击事件 触发select 和 unselect事件
     * @param {cc.Event} event 
     */
    _onItemTouched(event) {
        let target = event.target;
        let com = target.getComponent(this.itemComponentName);
        this._selectOne(com, true);
    },

    setSelectionWithoutCallback(data){
        let item = this.findItemDisplayByData(data);
        item && this._selectOne(item.getComponent(this.itemComponentName), false);
    },

    setSelectionAndCallback(data){
        let item = this.findItemDisplayByData(data);
        item && this._selectOne(item.getComponent(this.itemComponentName), true);
    },

    _selectOne(com, triggerOutsideCallback){
        if (this.selectedItemData && this.selectedItemData != com.data) {
            let item = this.findItemDisplayByData(this.selectedItemData);
            if(item){
                item.getComponent(this.itemComponentName).setSelectStatus(false);
                item.getComponent(this.itemComponentName).onUnselect();
            }
        }
        this.selectedItemData = com.data;
        com.setSelectStatus(true);
        com.onSelect();
        true === triggerOutsideCallback && this._onSelectOneItem(com.data);
    },

    /**
     * 根据item的数据data查找显示对象Item，当开启虚拟列表的时候，返回对象可能不存在
     * @param {any} data 
     * @returns {cc.Prefab} 与数据对应的显示单元
     */
    findItemDisplayByData(data) {
        if (data && this._items) {
            let list = this._items;
            let comName = this.itemComponentName;
            for (let item of list) {
                if (item.getComponent(comName).data == data) {
                    return item;
                }
            }
            list = null;
            return null;
        } else {
            return null;
        }
    },

    /**
     * 更新item位置
     * @param {Node} item item节点
     * @param {Number} idx 索引
     */
    _updateItemPos(item, idx) {
        const columnNum = this.columnNum;
        const col = idx % columnNum;
        const row = Math.floor(idx / columnNum);
        item.x = -this._content.width * 0.5 + item.width * (0.5 + col) + this.spacingX * col;
        item.y = -item.height * (0.5 + row) - this.spacingY * (row) - this.paddingTop;
    },

    /**
     * 更新item
     * @param {Node} item item节点
     * @param {*} idx 索引
     */
    _updateItem(item, data, idx) {
        // 更新位置
        this._updateItemPos(item, idx);
        // 更新id
        item.getComponent(this.itemComponentName).updateItem(data, idx);
    },

    /**
     * 获取content总高度
     * @param {Number} totalCount 总数量
     * @returns {Number} 容器总高度
     */
    _getContentHeight(totalCount) {
        return Math.ceil(totalCount / this.columnNum) * (this._itemHeight + this.spacingY) + this.paddingTop + this.paddingBottom;
    },

    /**
     * 是否在顶端
     * @returns {Boolean}
     */
    isTop() {
        return this._getScrollOffsetY() <= 0;
    },

    /**
     * 滚动到顶部
     */
    scrollToTop() {
        this._scrollToFixedPosition(0, .2);
    },

    /**
     * 滚动到固定位置
     * @param {Number} itemIndex item index
     * @param {*} sec 滚动时间
     */
    _scrollToFixedPosition(itemIndex, sec) {
        this._stopAutoScroll();
        const columnNum = this.columnNum;
        const col = itemIndex % columnNum;
        const row = Math.floor(itemIndex / columnNum);
        let itemHeight = this.itemTemplatePrefab.data.height;
        let y = -itemHeight * (0.5 + row) - this.spacingY * (row) - this.paddingTop;
        let pos = cc.v2(0, y);
        this._gridList.scrollToOffset(pos, sec || 0);

        if (this.useVirtualLayout) {
            this._content.destroyAllChildren();
            let startIndex = itemIndex - col;
            this._createFixedIncrementItems(startIndex);
        }
    },

    /**
     * 停止自动滚动
     */
    _stopAutoScroll() {
        if (!this._gridList.isAutoScrolling()) return;
        this._gridList.stopAutoScroll();
    },

    /**
     * 获取item在scrView上的位置
     * @param {cc.Prefab} item 显示单元
     * @returns {Vec3 | Vec2} 显示单元位置
     */
    _getPositionInView(item) {
        let worldPos = item.parent.convertToWorldSpaceAR(item.position);
        let viewPos = this._gridList.node.convertToNodeSpaceAR(worldPos);
        return viewPos;
    },

    /**
     * 获取当前Y轴偏移量整数
     * @returns {Number}
     */
    _getScrollOffsetY() {
        return Math.floor(this._gridList.getScrollOffset().y);
    },

    /**
     * 添加并等待加载图片
     * @param {String} uri 加载图片地址
     * @param {*} callback  加载完成回调方法
     * @param {*} thisObj  回调方法的this对象
     */
    loadImage(uri, callback, thisObj) {
        let list = this._imgLoadingList;
        let imgMap = this._imgMap;
        if (!list) {
            list = this._imgLoadingList = [];
            imgMap = this._imgMap = new Map();
        }
        if (this.cacheImage) {
            let frame = imgMap.get(uri);
            if (frame && callback) {
                callback.call(thisObj, frame, uri);
                return;
            }
        }
        list.push({
            uri: uri,
            cb: callback,
            thisObj: thisObj
        });
        if (!this._imgLoading) {
            this._imgLoading = true;
            this._loopLoadImage(list, this._loadImgDuration, imgMap);
        }
    },

    /**
     * 获取缓存图片
     * @param {String} key
     * @returns {cc.Texture2D} 纹理
     */
    getImageFromCache(key) {
        return this._imgMap.get(key);
    },

    /**
     * 循环排队加载图片列表
     * @param {Array} list 要加载的图片列表 [{uri, cb, thisObj}] 
     * @param {Number} duration 帧内加载最大时长
     * @param {*} imgMap 图片缓存map
     */
    _loopLoadImage(list, duration, imgMap) {
        // 执行之前，先记录开始时间
        let startTime = new Date().getTime();
        while (list.length > 0) {

            let data = list.pop();
            this._loadSingleImage(data.uri, data.cb, data.thisObj, imgMap);

            // 每执行完一段小代码段，都检查一下是否已经超过我们分配的本帧，这些小代码端的最大可执行时间
            if (new Date().getTime() - startTime > duration) {
                // 如果超过了，那么本帧就不在执行，开定时器，让下一帧再执行
                this.scheduleOnce(() => {
                    this._loopLoadImage(list, duration, imgMap);
                });
                return;
            }
        }
        this._imgLoading = false;
    },

    /**
     * 加载单张图片
     * @param {String} uri 加载图片地址
     * @param {*} callback  加载完成回调方法
     * @param {*} thisObj  回调方法的this对象
     * @param {*} imgMap 图片缓存map
     */
    _loadSingleImage(uri, cb, thisObj, imgMap) {
        cc.loader.loadRes(uri, cc.SpriteFrame, (err, frame) => {
            if (err) {
                lc.GameLogger.err('error to loadRes: ' + uri + ', ' + err || err.message);
                return;
            }
            this.cacheImage && imgMap.set(uri, frame);
            if (cb) {
                cb.call(thisObj, frame, uri);
            }
            // // 自动释放SpriteFrame和关联Texture资源
            // cc.loader.setAutoReleaseRecursively(frame, true);
        });
    },

    /**
     * 清空列表
     */
    clearList() {
        this._dataList = null;
        this._disposeItems();
        this.createItemsDisplayList();
    },

    /**
     * 清理回收所有显示单元
     */
    _disposeItems() {
        cc.isValid(this._content) && this._gridList.content.destroyAllChildren();
        this._items = null;
    },

    /**
     * 回收
     */
    onDestroy() {
        if (this.useVirtualLayout) {
            this.node.off('scrolling', this._onScrolling, this);
        }
        this._scrollToBottomHandler = null;
        this._scrollToBottomThisObj = null;
        this._selectOneItemHandler = null;
        this._selectOneItemThisObj = null;
        this._disposeItems();
        this._dataList = null;
        this._imgMap && this._imgMap.clear();
        this._imgMap = null;
        lc.NotificationManager.targetOff(this);
    }
});

module.exports = VirtualGridList;