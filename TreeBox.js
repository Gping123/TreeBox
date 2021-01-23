/**
 * 树形选择器组件
 *
 * @author GP
 * DateTime 2020/12/26 14:10
 */
class TreeBox {

    /**
     * 选择器
     * @type {string}
     */
    selector = '';

    /**
     * 数据
     * @type {Array}
     */
    data = [];

    /**
     * 已选择项
     * @type {Array}
     */
    selected = new Set();

    /**
     * ID映射对象
     *      保存id间的关系
     * @type {{}}
     */
    mapIdObj = {};

    /**
     * 对象值
     * @type {{}}
     */
    value = {};

    /**
     * 构造方法
     *
     * @param selector
     * @param data
     * @param selected
     */
    constructor(selector, data, selected = [])
    {
        this.selector = selector;
        this.data = data;
        this.selected = new Set(selected);

        this.formatData();

        this.initHtml();

        this.initMonitoringEvents();

    }

    /**
     * 格式化数据结构
     */
    formatData()
    {
        var _data = {};
        // 构建结构数据 [按parent_id分组， 默认parent_id为0]
        for(var i in this.data){
            var d = this.data[i];
            if(!d.hasOwnProperty('parent_id')){
                d.parent_id = 0;
            }
            if(typeof(_data[d.parent_id]) != 'object'){
                _data[d.parent_id] = [d];
                this.mapIdObj[d.parent_id] = [d.id];
            }else{
                _data[d.parent_id].push(d);
                this.mapIdObj[d.parent_id].push(d.id);
            }
        }

        this.data = _data;
    }

    /**
     * 初始化页面
     */
    initHtml()
    {
        $(this.selector).addClass('tree-box').html(
            `<div class="tree-box-header">
                <div class="tree-box-label-list"></div>
                <div class="tree-box-clear">
                    <div class="tree-box-clear-all" title="点击清除所有">清除所有</div>
                </div>
            </div>
            <div class="tree-box-container"></div>`
        );

        var html = '';
        for(var parent_id in this.data){
            // 按组渲染
            var list = this.data[parent_id];
            var html_list = "";

            for(var j in list){
                var item = list[j];

                // 默认选择项
                let checked = '';
                if(this.selected && $.inArray(item.id , this.selected) != -1){
                    checked = " checked='checked'";
                }else{
                    checked = "";
                    try{
                        if(item.selected){
                            checked = " checked='checked'";
                        }
                    }catch(err){}
                }

                // 设置 class
                var _class = "";
                if(typeof(this.data[item.id]) == 'object'){
                    _class += " children";
                }

                try{
                    if(item.is_hidden){
                        _class += " hide2";
                    }
                }catch(err){}

                if(_class){
                    _class = " class='"+_class+"'";
                }

                // 设置复选框ID
                var id = 'treebox_'+item.id ;
                var box = "<input "+checked+" type='checkbox' id='"+ id +"' name='"+ this.name +"' value='"+ item.id +"' />";

                try{
                    // 判断是否显示复选框
                    if(item.no_box){
                        box = '';
                    }
                }catch(err){}

                html_list+="<li "+_class+" v="+item.id+" title='"+item.name+"'><em>"+box+"</em><div class='label-panel'><label for='"+id+"'>"+item.name+"</label></div><span></span></li>";
            }

            _class = 'box';
            if(parent_id === '0'){
                _class += " root";
            }else{
                _class += " hide";
            }

            _class = " class='"+_class+"'";

            html += "<div parent_id="+parent_id+_class+"><ul>"+html_list+"</ul></div>";
        }

        $(this.selector + ' .tree-box-container').html(html);
    }

    /**
     * 初始化监听事件
     */
    initMonitoringEvents()
    {
        // 点击行事件
        this.listenRowEvent();

        // 选择复选框事件
        this.listenSelectedEvent();

        // 清除事件
        this.listenClearEvent();
    }

    /**
     * 监听清除所有事件
     */
    listenClearEvent()
    {
        let oldThis = this;
        $(this.selector+ ' .tree-box-clear .tree-box-clear-all').on('click', function () {
             oldThis.selected = new Set([]);
             oldThis.value = {};
             oldThis.renderSelected();
        });
    }

    /**
     * 监听行事件
     *      展开|显示某部分
     */
    listenRowEvent()
    {
        let oldthis = this;
        $(this.selector + ' .children').on('click' ,  function(e){
            oldthis.showChildren(this)
        });
    }

    /**
     * 显示节点
     * @param that
     */
    showChildren(that)
    {
        var li = $(that);
        li.parent().find('.cur').removeClass('cur');
        li.addClass('cur');

        var id = li.attr('v');
        var col = li.parent().parent().attr('col');
        if(!col){
            col = 0;
        }
        var _col = col;
        while(1){
            _col++;
            var o = $(this.selector+" div[col="+_col+"]");
            if(o.size()>0){
                o.hide();
            }else{
                break;
            }
        }
        $(this.selector+" div[parent_id="+id+"]").attr('col' , col*1+1).removeClass('hide').show();
    }

    /**
     * 监听选择事件
     */
    listenSelectedEvent()
    {
        let oldThis = this;
        $(this.selector + ' input[type="checkbox"]').click(function(){
            let id = $(this).parents('li').attr('v');
            let status = oldThis.getIdSelectStatus(id);
            // 计算选择状态
            oldThis.calcSelectStatus(id, status, true, true);

            // 渲染选择状态
            oldThis.renderSelected()

        });
    }

    /**
     * 监听label关闭事件
     */
    listenCloseLabelEvent()
    {
        let oldThis = this;
        $(this.selector+ ' .close').on('click', function () {
            let id = $(this).parents('.tree-box-label').attr('value');
            oldThis.calcSelectStatus(id, false, true, true);
            oldThis.renderSelected();
        });
    }

    /**
     * 设置选择值
     *
     * @param id
     * @param status
     */
    setValue(id, status)
    {
        if (status) {
            // 设置选择状态
            this.selected.add(id);
            this.value[id] = this.getText(id);

        } else {
            this.selected.delete(id);
            delete this.value[id];
        }
    }

    /**
     * 计算选择状态
     *
     * @param id
     * @param status
     * @param calcSubset
     * @param calcParent
     */
    calcSelectStatus(id, status, calcSubset, calcParent)
    {
        if (id == 0) {
            return ;
        }

        let parentId = this.getParentId(id);
        let oldThis = this;

        // 同级计算
        if (calcParent && this.mapIdObj.hasOwnProperty(parentId)) {
            if (status) {

                /**
                 * 算法：
                 *      1、设置当前元素的选择状态
                 *      2、判断当前元素的同级所有元素是否全部已选
                 *      3、如果没全选，则直接跳过
                 *      4、如果已经选，则设置父级元素选择状态并且删除所有存在在this.selected中的当前同级所有元素
                 *      5、递归父级选择状态
                 */
                this.setValue(id, status);

                // 取消所有子集的选择状态
                if (calcSubset && this.mapIdObj.hasOwnProperty(id)) {
                    this.calcSelectStatus(id, status, true, false);
                }

                // 如果全选了
                if (parentId != 0 && this.contain(this.mapIdObj[parentId])) {
                    this.setValue(parentId, status);

                    // 清除子集选中状态
                    this.calcSelectStatus(parentId, status, true, false);

                    // 所有父级操作
                    this.calcSelectStatus(parentId, status, false, true);
                }
            } else {

                /**
                 *  算法：
                 *      1、如果当前元素存在于this.selected中，直接取消选择状态
                 *      2、不存在，则
                 *          2.1 查询当前元素最顶级并且已选状态的元素ID 并且ID值是非0
                 *          2.2 取消（1）元素的选择状态
                 *          2.3 保持非直接顶级元素的选择状态
                 *          2.4 保存当前元素级别的其它元素（非本身）选择状态
                 */
                if (this.contain(id)) {
                    this.setValue(id, status);
                } else {
                    // 找出离当前点击元素最近的低级选择元素
                    let ids = this.getSelectedParentIds(id);

                    this.setValue(this.getTopSelectedParentId(id), status);

                    ids.forEach((supperId) => {
                        if (this.mapIdObj.hasOwnProperty(supperId)) {
                            this.mapIdObj[supperId].forEach((tmpId) => {
                                if (
                                    !ids.includes(tmpId)
                                ) {
                                    oldThis.setValue(tmpId, !status);
                                }
                            });
                        }
                    });

                    // 设置当前级别除了当前元素外的所有元素
                    this.mapIdObj[parentId].forEach((tmpId) => {
                        if (id != tmpId) {
                            oldThis.setValue(tmpId, !status);
                        } else {
                            this.setValue(tmpId, status);
                        }
                    });
                }
            }

        }

        // 子集计算
        if (calcSubset && this.mapIdObj.hasOwnProperty(id)) {
            if (status) {
                this.mapIdObj[id].forEach((tmpId) => {

                    oldThis.setValue(tmpId, !status);

                    // 递归取消所有
                    oldThis.calcSelectStatus(tmpId, status, true, false);
                });
            }
        }

    }

    /**
     * 已经选择包含判断
     *
     * @param subset
     * @returns {boolean|*}
     */
    contain(subset)
    {

        if (typeof(subset) == 'array' || typeof(subset) == 'set' || typeof(subset) == 'object') {

            var status = true;
            subset.forEach((v) => {
                if (!this.contain(v)) {
                    return status = false;
                }
            });

            return status;
        }

        return this.selected.has(subset);
    }

    /**
     * 获取id的text
     *
     * @param id
     * @returns {string|null}
     */
    getText(id)
    {
        return $(this.selector+ ' li[v="'+id+'"]').find('label').text();
    }

    /**
     * 获取父节点ID
     *
     * @param id
     * @returns {string|number}
     */
    getParentId(id)
    {
        return $(this.selector+ ' [v="'+id+'"]').parents('.box').attr('parent_id');
    }

    /**
     * 获取顶级节点ID
     *
     * @param id
     * @param topId
     * @returns {*}
     */
    getTopParentId(id, topId = 0)
    {
        let parentId = id;

        while (topId != (parentId = this.getParentId(id))) {
            id = parentId;
        }

        return id;
    }

    /**
     * 获取最顶级已选的父级ID
     *
     * @param id
     * @returns {*}
     */
    getTopSelectedParentId(id)
    {
        let parentId = id;
        while ((parentId = this.getParentId(id)) && this.getIdSelectStatus(parentId)) {
            id = parentId;
        }

        return id;
    }

    /**
     * 获取所有已经选择的直接父级ID列表
     *
     * @param id
     * @return Array
     */
    getSelectedParentIds(id)
    {
        let Ids = [];
        let parentId = id;
        while ((parentId = this.getParentId(id)) && this.getIdSelectStatus(parentId)) {
            id = parentId;
            Ids.unshift(parentId);
        }

        return Ids;
    }

    /**
     * 获取指定ID选中状态
     *
     * @param id
     * @returns {boolean}
     */
    getIdSelectStatus(id)
    {
        return $(this.selector+' input[type="checkbox"][value="'+id+'"]').is(':checked');
    }

    /**
     * 渲染选择
     */
    renderSelected(pid = null)
    {
        let oldThis = this;
        let data = pid || this.selected;

        if (pid == null) {
            $(this.selector + ' input[type="checkbox"]').prop('checked', false);
        }

        if (Array.from(this.selected).length > 0) {
            $(oldThis.selector+' .tree-box-clear .tree-box-clear-all').show();
        } else {
            $(oldThis.selector+' .tree-box-clear .tree-box-clear-all').hide();
        }

        // 渲染选择状态
        data.forEach((v) => {
            $(oldThis.selector + ' [value="' + v + '"]').prop('checked', true);
            oldThis.mapIdObj.hasOwnProperty(v) && oldThis.renderSelected(oldThis.mapIdObj[v]);
        });

        // 渲染头部显示
        $(this.selector + ' .tree-box-label-list').html('');
        for (let i in oldThis.value) {
            oldThis.addHeaderLabelItem(i);
        }
    }

    /**
     * 添加头部标签显示
     * @param id
     */
    addHeaderLabelItem(id)
    {
        let text = this.getText(id);
        let html = `<div class="tree-box-label" value='${id}'> ${text} <span class="close">✖</span></div>`;
        $(this.selector + ' .tree-box-label-list').append(html);

        // 标签关闭事件
        this.listenCloseLabelEvent();
    }

    /**
     * 获取值
     * @returns {{}}
     */
    getValue()
    {
        return this.value;
    }

    /**
     * 返回已选择ID项
     * @return {Array|(function())}
     */
    getSelected()
    {
        return this.selected;
    }

}
