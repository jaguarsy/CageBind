(function ($) {
    'use strict';

    var _map = function (list, callback) {
        var result = [];

        if (!list) {
            return result;
        }

        if (!list.length) {
            list = [].concat(list);
        }

        for (var i = 0; i < list.length; i++) {
            var item = list[i];

            result.push(callback(item, i) || item);
        }

        return result;
    };

    var _createMap = function () {
        return Object.create(null);
    };

    var _isDefined = function (value) {
        return typeof value !== 'undefined';
    };

    var _isString = function (value) {
        return typeof value === 'string';
    };

    var _lowercase = function (str) {
        return _isString(str) ? str.toLowerCase() : str;
    };

    //region //Lexer, copy from angular.js - parse.js//

    var OPERATORS = _createMap();

    _map('+ - * / % === !== == != < > <= >= && || ! = |'.split(' '), function (operator) {
        OPERATORS[operator] = true;
    });

    var ESCAPE = {'n': '\n', 'f': '\f', 'r': '\r', 't': '\t', 'v': '\v', '\'': '\'', '"': '"'};

    var Lexer = function () {
    };

    Lexer.prototype = {
        constructor: Lexer,

        lex: function (text) {
            this.text = text;
            this.index = 0;
            this.tokens = [];

            while (this.index < this.text.length) {
                var ch = this.text.charAt(this.index);
                if (ch === '\'' || ch === '\'') {
                    this.readString(ch);
                } else if (this.isNumber(ch) || ch === '.' && this.isNumber(this.peek())) {
                    this.readNumber();
                } else if (this.isIdent(ch)) {
                    this.readIdent();
                } else if (this.is(ch, '(){}[].,;:?')) {
                    this.tokens.push({index: this.index, text: ch});
                    this.index++;
                } else if (this.isWhitespace(ch)) {
                    this.index++;
                } else {
                    var ch2 = ch + this.peek();
                    var ch3 = ch2 + this.peek(2);
                    var op1 = OPERATORS[ch];
                    var op2 = OPERATORS[ch2];
                    var op3 = OPERATORS[ch3];
                    if (op1 || op2 || op3) {
                        var token = op3 ? ch3 : (op2 ? ch2 : ch);
                        this.tokens.push({index: this.index, text: token, operator: true});
                        this.index += token.length;
                    } else {
                        this.throwError('Unexpected next character ', this.index, this.index + 1);
                    }
                }
            }
            return this.tokens;
        },

        is: function (ch, chars) {
            return chars.indexOf(ch) !== -1;
        },

        peek: function (i) {
            var num = i || 1;
            return (this.index + num < this.text.length) ? this.text.charAt(this.index + num) : false;
        },

        isNumber: function (ch) {
            return ('0' <= ch && ch <= '9') && typeof ch === 'string';
        },

        isWhitespace: function (ch) {
            // IE treats non-breaking space as \u00A0
            return (ch === ' ' || ch === '\r' || ch === '\t' ||
            ch === '\n' || ch === '\v' || ch === '\u00A0');
        },

        isIdent: function (ch) {
            return ('a' <= ch && ch <= 'z' ||
            'A' <= ch && ch <= 'Z' ||
            '_' === ch || ch === '$');
        },

        isExpOperator: function (ch) {
            return (ch === '-' || ch === '+' || this.isNumber(ch));
        },

        throwError: function (error, start, end) {
            end = end || this.index;
            var colStr = _isDefined(start) ?
                ('s ' + start + '-' + this.index + ' [' + this.text.substring(start, end) + ']') :
                (' ' + end);

            throw 'Lexer Error: ' + error + ' at column' + colStr + ' in expression [' + this.text + '].';
        },

        readNumber: function () {
            var number = '';
            var start = this.index;
            while (this.index < this.text.length) {
                var ch = _lowercase(this.text.charAt(this.index));
                if (ch == '.' || this.isNumber(ch)) {
                    number += ch;
                } else {
                    var peekCh = this.peek();
                    if (ch == 'e' && this.isExpOperator(peekCh)) {
                        number += ch;
                    } else if (this.isExpOperator(ch) &&
                        peekCh && this.isNumber(peekCh) &&
                        number.charAt(number.length - 1) == 'e') {
                        number += ch;
                    } else if (this.isExpOperator(ch) &&
                        (!peekCh || !this.isNumber(peekCh)) &&
                        number.charAt(number.length - 1) == 'e') {
                        this.throwError('Invalid exponent');
                    } else {
                        break;
                    }
                }
                this.index++;
            }
            this.tokens.push({
                index: start,
                text: number,
                constant: true,
                value: Number(number)
            });
        },

        readIdent: function () {
            var start = this.index;
            while (this.index < this.text.length) {
                var ch = this.text.charAt(this.index);
                if (!(this.isIdent(ch) || this.isNumber(ch))) {
                    break;
                }
                this.index++;
            }
            this.tokens.push({
                index: start,
                text: this.text.slice(start, this.index),
                identifier: true
            });
        },

        readString: function (quote) {
            var start = this.index;
            this.index++;
            var string = '';
            var rawString = quote;
            var escape = false;
            while (this.index < this.text.length) {
                var ch = this.text.charAt(this.index);
                rawString += ch;
                if (escape) {
                    if (ch === 'u') {
                        var hex = this.text.substring(this.index + 1, this.index + 5);
                        if (!hex.match(/[\da-f]{4}/i)) {
                            this.throwError('Invalid unicode escape [\\u' + hex + ']');
                        }
                        this.index += 4;
                        string += String.fromCharCode(parseInt(hex, 16));
                    } else {
                        var rep = ESCAPE[ch];
                        string = string + (rep || ch);
                    }
                    escape = false;
                } else if (ch === '\\') {
                    escape = true;
                } else if (ch === quote) {
                    this.index++;
                    this.tokens.push({
                        index: start,
                        text: rawString,
                        constant: true,
                        value: string
                    });
                    return;
                } else {
                    string += ch;
                }
                this.index++;
            }
            this.throwError('Unterminated quote', start);
        }
    };

    //endregion/

    $.fn.extend({
        //绑定对象
        bindData: function (data) {
            // 是否为纯对象
            //if (!$.isPlainObject(data)) {
            //    return;
            //}

            var that = this,
                cgFuncEnum;

            var isNull = function (value) {
                return value === null || value === undefined;
            };

            // 针对不同元素的赋值方法
            var setval = function (element, value) {
                //if (isNull(value)) return;

                if (element.is('input') || element.is('select')) {
                    if (element.is('[type=checkbox]')) {
                        element.prop('checked', value);
                    } else if (element.is('[type=radio]')) {
                        var str = value ? value.toString() : undefined;
                        element.prop('checked', str == element.val());
                    } else {
                        element.val(value);
                        element.trigger('change');
                    }
                } else if (element.is('img') && value) {
                    element.attr('src', value);
                } else {
                    element.html(value);
                }
            };

            var _lexer = new Lexer();

            var getval = function (context, expression) {
                if (!expression) {
                    return;
                }

                var tokens = _lexer.lex(expression);
                var contextStr = 'context.';

                var result = _map(tokens, function (item, index) {
                    if (context &&
                        item.identifier &&
                        (index === 0 ||
                        tokens[index - 1].operator ||
                        tokens[index - 1].text === '[' )) {
                        return contextStr + item.text;
                    }
                    return item.text;
                });

                try {
                    var val = eval(result.join(''));
                    return val === undefined ? null : val;
                } catch (e) {
                    console.warn(e);
                    return null;
                }
            };

            //// 根据key获取对象属性值，支持obj.key1.key2的调用方式
            //var getval = function (obj, key) {
            //    if (!key) {
            //        return;
            //    }
            //
            //    var keys = key.split(/[\.\[\]]/),
            //        result = obj;
            //
            //    for (var i = 0, len = keys.length; i < len; i++) {
            //        if (keys[i] && result) {
            //            result = result[keys[i]];
            //        }
            //    }
            //
            //    return result === undefined ? null : result;
            //};

            cgFuncEnum = {
                'cg-show': function (element) {
                    var attr = element.attr('cg-show');
                    if (!attr) {
                        return;
                    }

                    if (getval(data, attr)) {
                        element.show();
                    } else {
                        element.hide();
                    }
                },
                'cg-class': function (element) {
                    var value = element.attr('cg-class');

                    if (!value) {
                        return;
                    }

                    value = value.replace('{', '').replace('}', '');

                    value.split(',').forEach(function (item) {
                        var arr = item && item.split(':');

                        if (arr) {
                            getval(data, arr[1].trim()) &&
                            element.addClass(arr[0].trim());
                        }
                    });
                },
                'cg-value': function (element) {
                    var value = element.attr('cg-value');
                    element.val(getval(data, value));
                },
                'cg-list': function (element) {
                    var value = element.attr('cg-list');
                    var tpl = element.attr('cg-list-tpl');
                    var list = getval(data, value);

                    if (tpl && list && list.length) {
                        element.cgbind({
                            templateId: '#' + tpl,
                            data: list
                        });
                    } else {
                        element.empty();
                    }
                },
                'cg-disabled': function (element) {
                    var disabled = getval(data, element.attr('cg-disabled'));
                    element.prop('disabled', disabled);
                }
            };

            // 替换属性值中的{{}}, 以及对一些特殊绑定的特殊处理
            var replaceAttr = function (element, obj) {
                element = $(element);

                var attrs = element[0] ? element[0].attributes : [],
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
                        if (!matches.hasOwnProperty(item)) {
                            continue;
                        }
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

                var htmlMatches = html.match(re);
                if (!htmlMatches) {
                    return;
                }
                htmlMatches.forEach(function (item) {
                    index = item.replace('{{', '').replace('}}', '');
                    value = getval(obj, index);
                    if (!isNull(value)) {
                        element.html(html.replace(item, value));
                    }
                });
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
                        ele.text(data[i]);
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
                templateId = config.templateId;

            if ($.isArray(data)) {
                if (!templateId) {
                    return;
                }
                that.bindList(config, callback);
            } else if (typeof data === 'object') {
                if (templateId) {
                    config.data = [data];
                    that.bindList(config, callback);
                } else {
                    that.bindData(data);
                }
            }
        }
    });

})(window.jQuery);