(function() {
function replace_characters(string, replacements) {
	return string.split('').map(function(character) {
		return (replacements.hasOwnProperty(character) ? replacements[character] : character);
	}).join('');
}

function reverse(string) {
	return string.split('').reverse().join('');
}

class Barcode {
	// Concrete subclasses of Barcode must implement the static data_to_row_patterns() function
	// Returns an array of strings consisting only of '0' and '1' characters, with each string representing one line/row of the barcode
	static data_to_row_patterns(data) {
		throw Error('static data_to_row_patterns() not implemented');
	}

	static get QUIET_ZONE() {
		throw Error('static get QUIET_ZONE() not implemented');
	}

	static get QUIET_ZONE_X() {
		return this.QUIET_ZONE;
	}

	static get QUIET_ZONE_Y() {
		return this.QUIET_ZONE;
	}

	static get PRESCALE_RATIO_X() {
	}

	static get PRESCALE_RATIO_Y() {
	}

	static create(...args) {
		return (new this(...args));
	}

	constructor(data) {
		this.data = data;
		this.row_patterns = this.constructor.data_to_row_patterns(data);
		this.raw_width = this.row_patterns[0].length;
		this.raw_height = this.row_patterns.length;
	}
};

class Barcode_1D extends Barcode {
	// Concrete subclasses of Barcode_1D must implement the static data_to_pattern() function
	// Returns a string consisting only of '0' and '1' characters
	static data_to_pattern(data) {
		throw Error('static data_to_pattern() not implemented');
	}

	static get QUIET_ZONE_Y() {
		return 0;
	}

	static get PRESCALE_RATIO_Y() {
		return 0.15;
	}

	static data_to_row_patterns(data) {
		return [this.data_to_pattern(data)];
	}
};

class Simple_Barcode_1D extends Barcode_1D {
	static data_to_symbol_ids(data) {
		throw Error('static data_to_symbol_ids() not implemented');
	}

	static get SYMBOL_PATTERNS() {
		throw Error('static get SYMBOL_PATTERNS() not implemented');
	}

	static get SYMBOL_SEPARATOR_PATTERN() {
		return '';
	}

	static symbol_id_to_symbol_pattern(symbol_id) {
		return this.SYMBOL_PATTERNS[symbol_id];
	}

	static data_to_pattern(data) {
		return this.data_to_symbol_ids(data).map(this.symbol_id_to_symbol_pattern, this).join(this.SYMBOL_SEPARATOR_PATTERN);
	}

	constructor(data) {
		super(data);
		this.pattern = this.row_patterns[0];
	}
};

class EAN_Like_Barcode extends Barcode_1D {
	static get QUIET_ZONE() {
		return 11;
	}

	static get DIGIT_PATTERNS() {
		return ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
	}

	static get SIDE_PATTERN() {
		return '101';
	}

	static get MIDDLE_PATTERN() {
		return '01010';
	}

	static right_digit_pattern(digit) {
		return this.DIGIT_PATTERNS[digit];
	}

	static left_odd_digit_pattern(digit) {
		return replace_characters(this.DIGIT_PATTERNS[digit], {'0':'1', '1':'0'});
	}

	static left_even_digit_pattern(digit) {
		return reverse(this.DIGIT_PATTERNS[digit]);
	}

	// <pattern_types>: String of "E" (="Even" = left even), "O" (="Odd" = left odd), "R" (="Right") characters
	static encode_digits(digits, pattern_types) {
		return digits.split('').map(function(digit, index) {
			return {'E':this.left_even_digit_pattern, 'O':this.left_odd_digit_pattern, 'R':this.right_digit_pattern}[pattern_types[index]].call(this, digit);
		}, this).join('');
	}

	static digit_to_pattern_types(digit) {
		return ['OOOOOO', 'OOEOEE', 'OOEEOE', 'OOEEEO', 'OEOOEE', 'OEEOOE', 'OEEEOO', 'OEOEOE', 'OEOEEO', 'OEEOEO'][digit];
	}

	static compute_check_digit(data_without_check_digit) {
		return ((10 - (data_without_check_digit.split('').reverse().reduce(function(accu, digit, index) {
			return (accu + (digit * ((index % 2) ? 1 : 3)));
		}, 0) % 10)) % 10);
	}

	static data_to_pattern(data) {
		let data_without_check_digit = data.slice(0, 12);
		data = `${data_without_check_digit}${this.compute_check_digit(data_without_check_digit)}`;
		return [this.SIDE_PATTERN, this.encode_digits(data.slice(1, 7), this.digit_to_pattern_types(data[0])), this.MIDDLE_PATTERN, this.encode_digits(data.slice(7, 13), 'RRRRRR'), this.SIDE_PATTERN].join('');
	}
};

class EAN_8 extends EAN_Like_Barcode {
	static get PRESCALE_RATIO_Y() {
		return 0.825;
	}

	static data_to_pattern(data) {
		let data_without_check_digit = data.slice(0, 7);
		data = `${data_without_check_digit}${this.compute_check_digit(data_without_check_digit)}`;
		return [this.SIDE_PATTERN, this.encode_digits(data.slice(0, 4), 'OOOO'), this.MIDDLE_PATTERN, this.encode_digits(data.slice(4, 8), 'RRRR'), this.SIDE_PATTERN].join('');
	}
};

function create_dom_element(name_at_namespace, attributes, ...childs) {
	let [name, namespace] = name_at_namespace.split('@')
	let element = (namespace ? document.createElementNS(namespace, name) : document.createElement(name));
	for (let key in attributes) {
		element.setAttribute(key, attributes[key]);
	}
	for (let child of childs) {
		element.appendChild(child);
	}
	return element;
}

function value_with_default(...values) {
	for (value of values) {
		if (! ((value === null) || (value === undefined) || (value !== value))) {
			return value;
		}
	}
}

class Barcode_Renderer {
	static render_with_values(row_patterns, options, scale_x, scale_y, quiet_zone_x, quiet_zone_y, unscaled_width, unscaled_height, scaled_width, scaled_height) {
		throw Error('static render_with_values() not implemented');
	}

	static render(barcode, options) {
		options = value_with_default(options, {});
		let barcode_class = barcode.constructor;

		let quiet_zone = options.quiet_zone;
		let quiet_zone_x = value_with_default(options.quiet_zone_x, quiet_zone, barcode_class.QUIET_ZONE_X);
		let quiet_zone_y = value_with_default(options.quiet_zone_y, quiet_zone, barcode_class.QUIET_ZONE_Y);

		let unscaled_width = (barcode.raw_width + (quiet_zone_x * 2));
		let unscaled_height = (barcode.raw_height + (quiet_zone_y * 2));

		let afterscale = value_with_default(options.scale, 1);
		let afterscale_x = value_with_default(options.scale_x, afterscale);
		let afterscale_y = value_with_default(options.scale_y, afterscale);

		let prescale_ratio_x = value_with_default(options.prescale_ratio_x, barcode_class.PRESCALE_RATIO_X);
		let prescale_ratio_y = value_with_default(options.prescale_ratio_y, barcode_class.PRESCALE_RATIO_Y);

		let prescale_x = value_with_default(options.prescale_x, (prescale_ratio_x * unscaled_height), 1);
		let prescale_y = value_with_default(options.prescale_y, (prescale_ratio_y * unscaled_width), 1);

		let scale_x = Math.round(prescale_x * afterscale_x);
		let scale_y = Math.round(prescale_y * afterscale_y);
		
		let scaled_width = (unscaled_width * scale_x);
		let scaled_height = (unscaled_height * scale_y);
		return this.render_with_values(barcode.row_patterns, options, scale_x, scale_y, quiet_zone_x, quiet_zone_y, unscaled_width, unscaled_height, scaled_width, scaled_height);
	}
};

class SVG_Barcode_Renderer extends Barcode_Renderer {
	static create_element(name, attributes, ...childs) {
		throw Error('static create_element() not implemented');
	}

	static pattern_to_path_data(pattern) {
		let path_data_fragments = [];
		let last_character;
		let bar_start_index;
		let offset_index = 0;
		for (let current_index = 0; (current_index <= pattern.length); current_index++) {
			let current_character = pattern[current_index];
			if (current_character !== last_character) {
				if (last_character === '1') {
					if (offset_index !== bar_start_index) {
						path_data_fragments.push(`m${bar_start_index - offset_index},0`);
						offset_index = bar_start_index;
					}
					path_data_fragments.push(`v1h${current_index - bar_start_index}v-1z`);
				} else {
					bar_start_index = current_index;
				}
				last_character = current_character;
			}
		}
		return path_data_fragments.join('');
	}

	static row_pattern_to_path_data(row_pattern, row_index) {
		return `M0,${row_index}${this.pattern_to_path_data(row_pattern)}`;
	}

	static row_patterns_to_path_d(row_patterns) {
		return row_patterns.map(this.row_pattern_to_path_data, this).join('');
	}

	static render_with_values(row_patterns, options, scale_x, scale_y, quiet_zone_x, quiet_zone_y, unscaled_width, unscaled_height, scaled_width, scaled_height) {
		return this.create_element('svg', {xmlns:'http://www.w3.org/2000/svg', viewBox:`0 0 ${unscaled_width} ${unscaled_height}`, width:scaled_width, height:scaled_height, preserveAspectRatio:'none'},
			this.create_element('rect', {width:unscaled_width, height:unscaled_height, fill:'#fff'}),
			this.create_element('path', {transform:`translate(${quiet_zone_x},${quiet_zone_y})`, d:this.row_patterns_to_path_d(row_patterns)}),
		);
	}
};

class SVG_Element_Barcode_Renderer extends SVG_Barcode_Renderer {
	static create_element(name, attributes, ...childs) {
		return create_dom_element(`${name}@http://www.w3.org/2000/svg`, attributes, ...childs);
	}
};

function define_barcode_element(element_name, Barcode_Class) {
	customElements.define(element_name, class extends HTMLElement {
		static get observedAttributes() {
			return ['data', 'quiet_zone', 'quiet_zone_x', 'quiet_zone_y', 'scale', 'scale_x', 'scale_y', 'prescale_ratio_x', 'prescale_ratio_y', 'prescale_x', 'prescale_y'];
		}

		constructor() {
			super();
			this.shadow_root = this.attachShadow({mode: 'open'});
		}

		get_attribute(key) {
			return (this.hasAttribute(key) ? this.getAttribute(key) : null);
		}

		render() {
			while (this.shadow_root.hasChildNodes()) {
				this.shadow_root.removeChild(this.shadow_root.lastChild);
			}
			let data = this.get_attribute('data');
			if (data !== null) {
				this.shadow_root.appendChild(SVG_Element_Barcode_Renderer.render(Barcode_Class.create(data), {
					quiet_zone: this.get_attribute('quiet_zone'),
					quiet_zone_x: this.get_attribute('quiet_zone_x'),
					quiet_zone_y: this.get_attribute('quiet_zone_y'),
					scale: this.get_attribute('scale'),
					scale_x: this.get_attribute('scale_x'),
					scale_y: this.get_attribute('scale_y'),
					prescale_ratio_x: this.get_attribute('prescale_ratio_x'),
					prescale_ratio_y: this.get_attribute('prescale_ratio_y'),
					prescale_x: this.get_attribute('prescale_x'),
					prescale_y: this.get_attribute('prescale_y'),
				}));
			}
		}

		attributeChangedCallback(attribute_name, old_value, new_value) {
			if (new_value !== old_value) {
				this.render();
			}
		}
	});
}

define_barcode_element('ean-8', EAN_8);
}).call(this);

