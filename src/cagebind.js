(function ($) {
    'use strict';

    $.fn.extend({
        //绑定对象
        bindData: function (data) {
            // 是否为纯对象
            if (!$.isPlainObject(data)) {
                return;
            }

            var that = this,
                cgFuncEnum;

            var isNull = function (value) {
                return value === null || value === undefined;
            };

            // 针对不同元素的赋值方法
            var setval = function (element, value) {
                if (element.is('input') || element.is('select')) {
                    if (element.is('[type=checkbox]')) {
                        element.prop('checked', value);
                    } else if (element.is('[type=radio]')) {
                        var str = value ? value.toString() : undefined;
                        element.prop('checked', str == element.val());
                    } else {
                        element.val(value).trigger('change');
                    }
                } else if (element.is('img') && value) {
                    element.attr('src', value);
                } else {
                    element.text(value);
                }
            };

            // 根据key获取对象属性值，支持obj.key1.key2的调用方式
            var getval = function (obj, key) {
                if (!key) {
                    return;
                }

                var keys = key.split(/[\.\[\]]/),
                    result = obj;

                for (var i = 0, len = keys.length; i < len; i++) {
                    if (keys[i] && result) {
                        result = result[keys[i]];
                    }
                }

                return result === undefined ? null : result;
            };

            cgFuncEnum = {
                'cg-show': function (element) {
                    var attr = element.attr('cg-show'),
                        value;
                    if (!attr) {
                        return;
                    }
                    var list = attr.split('==');
                    if (list.length > 1) {
                        value = getval(data, list[0]) == list[1];
                    } else {
                        value = getval(data, attr);
                    }

                    if (value) {
                        element.show();
                    } else {
                        element.hide();
                    }
                },
                'cg-class': function (element) {
                    var value = element.attr('cg-class'),
                        list = value && value.split(':'),
                        classname = list && list[0].trim(),
                        bool = getval(data, list && list[1].trim());

                    if (bool) {
                        element.addClass(classname);
                    }
                }
            };

            // 替换属性值中的{{}}, 以及对一些特殊绑定的特殊处理
            var replaceAttr = function (element, obj) {
                element = $(element);

                var attrs = element[0].attributes,
                    re = /\{\{([^\}]+)\}\}/g,
                    html = element.html(),
                    value,
                    index;

                for (var i = 0, len = attrs.length; i < len; i++) {
                    var attrvalue = attrs[i].value,
                        attrname = attrs[i].name;

                    if (cgFuncEnum[attrname]) {
                        cgFuncEnum[attrname](element);
                    }

                    var matches = attrvalue.match(re);
                    for (var item in matches) {
                        var name = matches[item];
                        if (name) {
                            index = name.replace('{{', '').replace('}}', '');
                            value = getval(obj, index);
                            if (!isNull(value)) {
                                attrs[i].value = attrs[i].value.replace(name, value);
                            }
                        }
                    }
                }

                if (re.test(html)) {
                    index = RegExp.$1;
                    value = getval(obj, index);
                    if (!isNull(value)) {
                        element.html(html.replace(re, value));
                    }
                }
            };

            // 递归遍历所有后代节点元素，并绑定数据
            var bindElement = function (element, obj) {
                element = $(element);
                var cgbind = element.attr('cg-bind'),
                    value = getval(data, cgbind),
                    children = element.children();

                if (children.length === 0) {
                    replaceAttr(element, obj);
                    if (!isNull(cgbind)) {
                        setval(element, value);
                    }
                    return;
                } else {
                    for (var i = children.length - 1; i >= 0; i--) {
                        bindElement(children[i], obj);
                    }
                    replaceAttr(element, obj);
                    if (!isNull(cgbind)) {
                        setval(element, value);
                    }
                }
            };

            bindElement(that, data);
        },
        //绑定列表
        bindList: function (config, callback) {
            var data = config.data || {},
                empty = config.empty === undefined ? true : config.empty,
                templateId = config.templateId,
                length = config.length;

            if (!$.isArray(data)) {
                return;
            }

            var that = this,
                template = $($(templateId).html());

            length = length || data.length;

            if (empty) {
                that.empty();
            }
            for (var i = 0, len = length; i < len; i++) {
                var item = template.clone();
                that.append(item);

                if ($.isPlainObject(data[i])) {
                    item.bindData(data[i]);
                } else {
                    var ele = item.find('[cg-bind=value]');

                    if (ele.is('input') || ele.is('select')) {
                        if (ele.is('[type=checkbox]') ||
                            ele.is('[type=radio]')) {
                            ele.prop('checked', data[i]);
                        } else {
                            ele.val(data[i]).trigger('change');
                        }
                    } else {
                        element.text(data[i]);
                    }
                }

                if ($.isFunction(callback)) {
                    callback(item, data[i]);
                }
            }
        },

        //对象列表通用绑定函数
        cgbind: function (config, callback) {
            var that = this,
                data = config.data || {},
                templateId = config.templateId,
                length = config.length;

            if ($.isPlainObject(data)) {
                if (templateId) {
                    config.data = [data];
                    that.bindList(config, callback);
                } else {
                    that.bindData(data);
                }
            } else if ($.isArray(data)) {
                if (!templateId) {
                    return;
                }
                that.bindList(config, callback);
            }
        }
    });

})(jQuery);