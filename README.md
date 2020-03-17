# CCVirtualGridList for Cocos Creator 虚拟列表
    这是基于Cocos Creator ScrollView 编写的一个具有虚拟布局特点的滚动控制容器。
    支持平滑滚动显示大量数据对象，图片元素可以实现异步按帧加载，保证滚动平滑。具
    有滚动翻页功能，自适应宽度显示多列，单项选择，局部更新等实用功能。

    It's a customized GridList control for cocos creator, with the virtual
     scrolling layout, smoothly scrolling for millions items.

# VirtualGridList Install 使用
    使用控件非常简单，只需要拷贝demo项目中三个文件VirtualGridList.prefab, 
    VirtualGridList.js, VirtualGridListBaseItem.js 到您的工程中Prefabs文
    件夹中即可。使用之前将VirtualGridList.prefab拖入画面中, 列表单元继承
    VirtualGridListBaseItem 就可以。

    Copy three files - VirtualGridList.prefab, VirtualGridList.js, 
    VirtualGridListBaseItem.js  into the folder "Prefabs" of your project. 
    Then drag "VirtualGridList.prefab" into the scene. The item template for
    display extends the class of VirtualGridListBaseItem.

# VirtualGridList 启动参数
    启动参数可以在creator 图形化界面填入，但是为了不受预制体的维护影响，建议通过初
    始化脚本接口传入启动参数。

  ### virtualGridList.initGridList(itemTemplatePrefab, itemComponentName, options?)

  ### 参数
    - itemTemplatePrefab    cc.Prefab   列表单元显示组件
    - itemComponentName     String      列表单元显示组件控制器名称, 必须继承 VirtualGridListBaseItem
    - options? {                     
        paddingTop?: Number             列表距离上边缘距离 默认为0
        paddingBottom?: Number          列表距离下边缘距离 默认为0
        spacingX?: Number               列间距 默认为3
        spacingY?: Number               行间距 默认为3
        columnNum?: Number              列数 默认为0，列数自动适配容器宽度
        useVirtualList?: Boolean        是否启用虚拟列表 默认为true
        emptyTip?: cc.String            没有数据显示提示
        cacheImage?: Boolean            通过virtualGridListBaseItem.loadImage()方法加载的
                                          图片，自动缓存，控件回收后，图片缓存将被全部释放。
    }

# VirtualGridList 功能接口
  
  ### createItemsDisplayList(dataList: any[]): void
        首次创建显示列表， dataList为数据数组

  ### appendItemsToDisplayList(dataList: any[]): void
        追加显示列表， dataList为追加的数据数组，适用于滚动翻页

  ### getDataList(): any[]                    
        获取数据数组

  ### getTemplateItems(): cc.Prefab[]
        获取显示对象列表

  ### clearList(): void
        清空列表

  ### findItemDisplayByData(data: any): cc.Prefab
        根据数据对象查找对应的显示对象，当开启虚拟列表的时候，返回对象可能不存在

  ### getImageFromCache(key: String): cc.Texture2D
        获取缓存图片

  ### addScrollToBottomEventHandler(handler: Function, thisObj: any): void
        注册滚动至底部回调方法

  ### refreshItemDisplays(some?: any[]): void
        修改数据后，刷新列表显示，some代表指定刷新的对象, 不传则刷新全部。

  ### isTop(): Boolean
        判断是否滚动至顶部

  ### scrollToTop(): void
        滚动至顶部

  ### scrollToFixedPosition(itemIndex: Number, sec?: Number): void
        滚动到固定位置 itemIndex代表滚动至指定显示对象的索引， sec为滚动动画时长


# VirtualGridListBaseItem 显示单元基类 （必须继承） 接口

  ### dataChanged(): void
        子类可覆盖方法，更新显示，自定义显示方法，当滚动交替或初始化的时候触发

  ### getItemIndex(): Number
        获取现实对象在队列中的索引

  ### onSelect(): void
        子类可覆盖方法，点选触发事件，只支持单选

  ### onUnselect(): void
        子类可覆盖方法，如果当前为选中状态，当其他单元被点选触发此事件

  ### loadImage(pic: String, cb: Function, thisObj: any): void
        VirtualGridList 提供的异步加载图片, 自动缓存。pic: 图片地址， cb: 图片加载后
        的回调方法，thisObj: 回调方法this对象

# 具体使用方法请参照demo

  
