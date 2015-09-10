(function($) {
	'use strict';

	$.fn.extend({
		bindData: function(data) {
			if (!$.isPlainObject(data)) {
				return;
			}

			var that = this;

			var setval = function(element, value) {
				if (element.is('input') || element.is('select')) {
					element.val(value).trigger('change');
				} else {
					element.text(value);
				}
			}

			var getval = function(obj, key) {
				if (!key) return;

				var keys = key.split('.'),
					result = obj;

				for (var i = 0, len = keys.length; i < len; i++) {
					result = result[keys[i]];
				}

				return result;
			};

			var replaceAttr = function(element, obj) {
				var element = $(element),
					attrs = element[0].attributes,
					re = /\{\{([^\}]+)\}\}/g,
					text = element.text();

				for (var i = 0, len = attrs.length; i < len; i++) {
					if (re.test(attrs[i].value)) {
						var index = RegExp.$1,
							value = getval(obj, index);
						if (value) {
							setval(element, value);
						}
					}
				}

				if (re.test(text)) {
					var index = RegExp.$1;
					value = getval(obj, index);
					if (value) {
						element.text(text.replace(re, value));
					}
				}
			};

			var bindElement = function(element, obj) {
				var element = $(element),
					cgbind = element.attr('cg-bind'),
					value = getval(data, cgbind),
					children = element.children();

				if (children.length === 0) {
					replaceAttr(element, obj);
					if (value) {
						setval(element, value);
					}
					return;
				} else {
					for (var i = children.length - 1; i >= 0; i--) {
						bindElement(children[i], obj)
					};
				}
			}

			bindElement(that, data);

			// for (var i = 0, len = children.length; i < len; i++) {
			// 	var child = $(children[i]),
			// 		cgbind = child.attr('cg-bind'),
			// 		value = getval(data, cgbind);

			// 	replaceAttr(child, data);
			// 	if (!value) {
			// 		continue;
			// 	}
			// 	setval(child, value);
			// }
		},
		bindList: function(config, callback) {
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