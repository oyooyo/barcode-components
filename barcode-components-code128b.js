(function() {
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

class Code_128 extends Simple_Barcode_1D {
	static get CHARACTERS() {
		throw Error('static get CHARACTERS() not implemented');
	}

	static get START_SYMBOL_ID() {
		throw Error('static get START_SYMBOL_ID() not implemented');
	}

	static character_to_symbol_id(character) {
		return this.CHARACTERS.indexOf(character);
	}

	static compute_check_symbol_id(data_symbol_ids) {
		return (data_symbol_ids.reduce((temp, data_symbol_id, index) => (temp + (data_symbol_id * Math.max(index, 1))), 0) % 103);
	}

	static data_to_symbol_ids(data) {
		let data_symbol_ids = [this.START_SYMBOL_ID, ...data.split('').map(this.character_to_symbol_id, this)];
		return [...data_symbol_ids, this.compute_check_symbol_id(data_symbol_ids), this.STOP_SYMBOL_ID];
	}

	static get SYMBOL_PATTERNS() {
		return [
			'11011001100', '11001101100', '11001100110', '10010011000',
			'10010001100', '10001001100', '10011001000', '10011000100',
			'10001100100', '11001001000', '11001000100', '11000100100',
			'10110011100', '10011011100', '10011001110', '10111001100',
			'10011101100', '10011100110', '11001110010', '11001011100',
			'11001001110', '11011100100', '11001110100', '11101101110',
			'11101001100', '11100101100', '11100100110', '11101100100',
			'11100110100', '11100110010', '11011011000', '11011000110',
			'11000110110', '10100011000', '10001011000', '10001000110',
			'10110001000', '10001101000', '10001100010', '11010001000',
			'11000101000', '11000100010', '10110111000', '10110001110',
			'10001101110', '10111011000', '10111000110', '10001110110',
			'11101110110', '11010001110', '11000101110', '11011101000',
			'11011100010', '11011101110', '11101011000', '11101000110',
			'11100010110', '11101101000', '11101100010', '11100011010',
			'11101111010', '11001000010', '11110001010', '10100110000',
			'10100001100', '10010110000', '10010000110', '10000101100',
			'10000100110', '10110010000', '10110000100', '10011010000',
			'10011000010', '10000110100', '10000110010', '11000010010',
			'11001010000', '11110111010', '11000010100', '10001111010',
			'10100111100', '10010111100', '10010011110', '10111100100',
			'10011110100', '10011110010', '11110100100', '11110010100',
			'11110010010', '11011011110', '11011110110', '11110110110',
			'10101111000', '10100011110', '10001011110', '10111101000',
			'10111100010', '11110101000', '11110100010', '10111011110',
			'10111101110', '11101011110', '11110101110', '11010000100',
			'11010010000', '11010011100', '1100011101011',
		];
	}

	static get QUIET_ZONE() {
		return 10;
	}

	static get STOP_SYMBOL_ID() {
		return 106;
	}
};

class Code_128b extends Code_128 {
	static get CHARACTERS() {
		return ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
	}

	static get START_SYMBOL_ID() {
		return 104;
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

define_barcode_element('code-128b', Code_128b);
}).call(this);

