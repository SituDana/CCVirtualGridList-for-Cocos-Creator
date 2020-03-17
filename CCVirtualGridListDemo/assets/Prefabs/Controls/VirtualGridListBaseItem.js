cc.Class({
    extends: cc.Component,

    ctor(){
        this.virtualGridList = null;  // 外层scrollview
        this.data = null;         // item数据
        this.$itemIndex = -1;         // item index
    },

    properties: {
        _scrollToBottomHandler: null, //滑动到底部回调事件
        _scrollToBottomThisObj: null, //滑动到底部回调事件this对象
    },

    onLoad() {

    },

    /**
     * 子类可覆盖方法，更新item 显示，item交替时候触发
     */
    dataChanged(){

    },

    /**
     * 更新item
     * @param {*} data 对应数据
     * @param {*} itemIndex 数据对象对应的列表索引
     */
    updateItem(data, index) {
        this.$itemIndex = index;
        this.data = data;
    },

    /**
     * 获取itemID
     * @returns {Number} 
     */
    getItemIndex() {
        return this.$itemIndex;
    },

    /**
     * 子类可覆盖方法，当被点击触发事件
     */
    onSelect(){
    },

    /**
     * 子类可覆盖方法，当其他单元被点击触发事件
     */
    onUnselect(){
    },

    /**
     * 异步加载图片
     * @param {String} pic 图片uri 
     * @param {Function} cb 加载完成之后回调方法
     * @param {*} thisObj 回调方法this对象
     */
    loadImage(pic, cb, thisObj){
        this.virtualGridList.loadImage(pic, cb, thisObj);
    },

    onDestroy(){
        this.data = null;
        this.virtualGridList = null;
    }
});
