cc.Class({
    extends: cc.Component,

    ctor() {
        this._gridListController = null;
        this._dataList = [];
        this._pageNo = 1;

        this._currentColumn = 0; //0:列数自适应宽度
    },

    statics: {

    },

    properties: {
        gridList: cc.Node,
        itemTemplate: cc.Prefab,
        lbSelectOne: cc.Label,
        labelChangeColumn: cc.Label
    },

    onLoad() {
        this._gridListController = this.gridList.getComponent("VirtualGridList");

        this.initGridList();
    },

    initGridList(){
        this._pageNo = 1;
        this._dataList = [];
        this._gridListController.initGridList(this.itemTemplate, 'ItemDisplayController', {
            paddingTop: 10,
            paddingBottom: 100,
            spacingY: 5,
            emptyTip: '什么也没有啊',
            columnNum: this._currentColumn,
            useVirtualLayout: true
        });
        this._gridListController.addScrollToBottomEventHandler(this._nextPage, this);
        this._gridListController.addSelectOneItemEventHandler(this._onSelectOneItem, this);
        this._showList(this._pageNo);
    },

    _onSelectOneItem(data){
        this.lbSelectOne.getComponent(cc.Label).string = JSON.stringify(data);
    },

    onBtnScrollToTop_Tap() {
        if (!this._gridListController.isTop()) {
            this._gridListController.scrollToTop();
        }
    },

    onBtnShowList_Tap() {
        this._pageNo = 1;
        this._dataList = [];
        this._showList(this._pageNo);
    },

    onBtnRefresh_Tap() {
        this._gridListController.refreshItemDisplays();
    },

    onBtnClear_Tap() {
        this._gridListController.clearList();
    },

    onBtnChangeColumn_Tap(){
        let column = this._currentColumn + 1;
        if(column > 2){
            column = 0;
        }
        if(column === 2){
            this.labelChangeColumn.getComponent(cc.Label).string = `自适应列数`
        } else {
            this.labelChangeColumn.getComponent(cc.Label).string = `显示${column + 1}列`
        }
        this._currentColumn = column;
        this._gridListController.clearList();
        this.initGridList();
    },

    onBtnUpdateItem_Tap() {
        let list = this._dataList;
        let targetList = [];
        let itemData;
        for (let i = 0; i < list.length && i < 5; i++) {
            itemData = list[i];
            let picId = 29 - i;
            itemData.pic = "avatar/avatar_" + picId;
            itemData.name = (i + 1) + '我更新了_' + Math.floor(1000 * Math.random());
            targetList.push(itemData);
        }
        itemData = null;
        list = null;
        this._gridListController.refreshItemDisplays(targetList);
        targetList = null;
    },

    _nextPage() {
        console.log('next page');
        this.scheduleOnce(() => {
            this._showList(++this._pageNo);
        }, .5)
    },

    _showList(pageNo, itemCount) {
        itemCount = itemCount || 29;
        let list = [];
        let total = pageNo * itemCount;
        let picIndex = 0;
        for (let i = (pageNo - 1) * itemCount + 1; i <= total; i++) {
            picIndex++;
            let item = {
                pic: "avatar/avatar_" + picIndex,
                date: "3/9 12:00",
                name: i + '_测试邮件 士大夫撒快递费就爱上了肯德基发收款单飞机萨克的积分'
            }
            list.push(item);
        }
        this._dataList = this._dataList ? this._dataList.concat(list) : list;

        this._gridListController.appendItemsToDisplayList(list);

    },


});