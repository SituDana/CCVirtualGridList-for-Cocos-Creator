/**
 * @classdesc 配合「VirtualGridList」组件使用的VirtualGridListItem组件
 * @description
 *
 * 用法：
 *
 *      1. 将本组件挂载在Item节点上
 *
 */
let VirtualGridListBaseItem = require("VirtualGridListBaseItem");

cc.Class({
    extends: VirtualGridListBaseItem,

    ctor() {
        this._currentBg = null;
    },

    properties: {
        imgItem: cc.Sprite,
        lbItemName: cc.Label,
        lbDate: cc.Label,
    },

    onLoad() {
        // 注册点击事件
        // this.node.on(cc.Node.EventType.TOUCH_END, this._onItemTouchEnd, this);
    },

    start() {
    },

    /**
     * 点击触发选择事件
     */
    onSelect(){
        console.log('select _' + this.$itemIndex);

        this.updateSelectionStatus();
    },

    onUnselect(){
        console.log('unselect _' + this.$itemIndex);
        
        this.updateSelectionStatus();
    },

    dataChanged() {
        this._super();
        const data = this.data;
        this.loadImage(data.pic, this._showImg, this);
        this.lbItemName.getComponent(cc.Label).string = data.name;
        this.lbDate.getComponent(cc.Label).string = data.date;
        
        this.updateSelectionStatus();
    },

    updateSelectionStatus(){
        if(true === this.data.$select){
            this.node.color = new cc.Color(52, 217, 235);
        } else {
            this.node.color = new cc.Color(255, 255, 255);
        }
    },

    _showImg(spriteFrame, uri) {
        if (this.data && spriteFrame && uri.replace('_gray', '') == this.data.pic) {
            this.imgItem.getComponent(cc.Sprite).spriteFrame = spriteFrame;
            this.imgItem.node.opacity = 255;
        }
    },

    onDestroy() {
        this._super();

        this.node.targetOff();
    }
});