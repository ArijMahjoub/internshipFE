/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function() {
    var initializing = false;
    window.JQClass = function() {};
    JQClass.classes = {};
    JQClass.extend = function extender(prop) {
        var base = this.prototype;
        initializing = true;
        var prototype = new this();
        initializing = false;
        for (var name in prop) {
            prototype[name] = typeof prop[name] == 'function' && typeof base[name] == 'function' ? (function(name, fn) {
                return function() {
                    var __super = this._super;
                    this._super = function(args) {
                        return base[name].apply(this, args || []);
                    };
                    var ret = fn.apply(this, arguments);
                    this._super = __super;
                    return ret;
                };
            })(name, prop[name]) : prop[name];
        }

        function JQClass() {
            if (!initializing && this._init) {
                this._init.apply(this, arguments);
            }
        }
        JQClass.prototype = prototype;
        JQClass.prototype.constructor = JQClass;
        JQClass.extend = extender;
        return JQClass;
    };
})();

(function($) {
    /** Abstract base class for collection plugins v1.0.1.
    	Written by Keith Wood (kbwood{at}iinet.com.au) December 2013.
    	Licensed under the MIT (http://keith-wood.name/licence.html) license.
    	@module $.JQPlugin
    	@abstract */
    JQClass.classes.JQPlugin = JQClass.extend({
        name: 'plugin',
        defaultOptions: {},
        regionalOptions: {},
        _getters: [],
        _getMarker: function() {
            return 'is-' + this.name;
        },
        _init: function() {
            $.extend(this.defaultOptions, (this.regionalOptions && this.regionalOptions['']) || {});
            var jqName = camelCase(this.name);
            $[jqName] = this;
            $.fn[jqName] = function(options) {
                var otherArgs = Array.prototype.slice.call(arguments, 1);
                if ($[jqName]._isNotChained(options, otherArgs)) {
                    return $[jqName][options].apply($[jqName], [this[0]].concat(otherArgs));
                }
                return this.each(function() {
                    if (typeof options === 'string') {
                        if (options[0] === '_' || !$[jqName][options]) {
                            throw 'Unknown method: ' + options;
                        }
                        $[jqName][options].apply($[jqName], [this].concat(otherArgs));
                    } else {
                        $[jqName]._attach(this, options);
                    }
                });
            };
        },
        setDefaults: function(options) {
            $.extend(this.defaultOptions, options || {});
        },
        _isNotChained: function(name, otherArgs) {
            if (name === 'option' && (otherArgs.length === 0 || (otherArgs.length === 1 && typeof otherArgs[0] === 'string'))) {
                return true;
            }
            return $.inArray(name, this._getters) > -1;
        },
        _attach: function(elem, options) {
            elem = $(elem);
            if (elem.hasClass(this._getMarker())) {
                return;
            }
            elem.addClass(this._getMarker());
            options = $.extend({}, this.defaultOptions, this._getMetadata(elem), options || {});
            var inst = $.extend({
                name: this.name,
                elem: elem,
                options: options
            }, this._instSettings(elem, options));
            elem.data(this.name, inst);
            this._postAttach(elem, inst);
            this.option(elem, options);
        },
        _instSettings: function(elem, options) {
            return {};
        },
        _postAttach: function(elem, inst) {},
        _getMetadata: function(elem) {
            try {
                var data = elem.data(this.name.toLowerCase()) || '';
                data = data.replace(/'/g, '"');
                data = data.replace(/([a-zA-Z0-9]+):/g, function(match, group, i) {
                    var count = data.substring(0, i).match(/"/g);
                    return (!count || count.length % 2 === 0 ? '"' + group + '":' : group + ':');
                });
                data = $.parseJSON('{' + data + '}');
                for (var name in data) {
                    var value = data[name];
                    if (typeof value === 'string' && value.match(/^new Date\((.*)\)$/)) {
                        data[name] = eval(value);
                    }
                }
                return data;
            } catch (e) {
                return {};
            }
        },
        _getInst: function(elem) {
            return $(elem).data(this.name) || {};
        },
        option: function(elem, name, value) {
            elem = $(elem);
            var inst = elem.data(this.name);
            if (!name || (typeof name === 'string' && value == null)) {
                var options = (inst || {}).options;
                return (options && name ? options[name] : options);
            }
            if (!elem.hasClass(this._getMarker())) {
                return;
            }
            var options = name || {};
            if (typeof name === 'string') {
                options = {};
                options[name] = value;
            }
            this._optionsChanged(elem, inst, options);
            $.extend(inst.options, options);
        },
        _optionsChanged: function(elem, inst, options) {},
        destroy: function(elem) {
            elem = $(elem);
            if (!elem.hasClass(this._getMarker())) {
                return;
            }
            this._preDestroy(elem, this._getInst(elem));
            elem.removeData(this.name).removeClass(this._getMarker());
        },
        _preDestroy: function(elem, inst) {}
    });

    function camelCase(name) {
        return name.replace(/-([a-z])/g, function(match, group) {
            return group.toUpperCase();
        });
    }
    $.JQPlugin = {
        createPlugin: function(superClass, overrides) {
            if (typeof superClass === 'object') {
                overrides = superClass;
                superClass = 'JQPlugin';
            }
            superClass = camelCase(superClass);
            var className = camelCase(overrides.name);
            JQClass.classes[className] = JQClass.classes[superClass].extend(overrides);
            new JQClass.classes[className]();
        }
    };
})(jQuery);