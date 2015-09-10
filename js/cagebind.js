(function($) {
    'use strict';

    $.fn.extend({
        bindData: function (data) {
            if (!$.isPlainObject(data)) {
                return;
            }

            var that = this;

            var isNull = function(value){
                return value === null || value === undefined;
            };

            var setval = function (element, value) {
                if (element.is('input') || element.is('select')) {
                    element.val(value).trigger('change');
                } else {
                    element.text(value);
                }
            };

            var getval = function (obj, key) {
                if (!key) {
                    return;
                }

                var keys = key.split('.'),
                    result = obj;

                for (var i = 0, len = keys.length; i < len; i++) {
                    result = result[keys[i]];
                }

                return result;
            };

            var replaceAttr = function (element, obj) {
                element = $(element);

                var attrs = element[0].attributes,
                    re = /\{\{([^\}]+)\}\}/g,
                    text = element.text(),
                    value,
                    index;

                for (var i = 0, len = attrs.length; i < len; i++) {
                    if (re.test(attrs[i].value)) {
                        index = RegExp.$1;
                        value = getval(obj, index);
                        if (!isNull(value)) {
                            attrs[i].value = attrs[i].value.replace(re, value);
                        }
                    }
                }

                if (re.test(text)) {
                    index = RegExp.$1;
                    value = getval(obj, index);
                    if (!isNull(value)) {
                        element.text(text.replace(re, value));
                    }
                }
            };

            var bindElement = function (element, obj) {
                element = $(element);
                var cgbind = element.attr('cg-bind'),
                    value = getval(data, cgbind),
                    children = element.children();

                if (children.length === 0) {
                    replaceAttr(element, obj);
                    if (!isNull(value)) {
                        setval(element, value);
                    }
                    return;
                } else {
                    for (var i = children.length - 1; i >= 0; i--) {
                        bindElement(children[i], obj);
                    }
                }
            };

            bindElement(that, data);
        },
        bindList: function (config, callback) {
            var data = config.data || {},
                templateId = config.templateId,
                length = config.length;

            if (!$.isArray(data)) {
                return;
            }

            var that = this,
                template = $($(templateId).html());

            length = length || data.length;

            that.empty();
            for (var i = 0, len = length; i < len; i++) {
                var item = template.clone();
                that.append(item);

                if ($.isPlainObject(data[i])) {
                    item.bindData(data[i]);
                } else {
                    var ele = item.find('[cg-bind=value]');
                    if (ele.is('input') || ele.is('select')) {
                        ele.val(data[i]).trigger('change');
                    } else {
                        ele.text(data[i]);
                    }
                }
            }

            if ($.isFunction(callback)) {
                callback(that);
            }
        },

        bind: function(config, callback) {
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