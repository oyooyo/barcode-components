(function() {
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

define_barcode_element('code-128b', Code_128b);
class Code_39 extends Simple_Barcode_1D {
	static character_to_symbol_id(character) {
		return '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ-. *$/+%'.indexOf(character);
	}

	static data_to_symbol_ids(data) {
		return `*${data}*`.split('').map(this.character_to_symbol_id, this);
	}

	static get SYMBOL_PATTERNS() {
		return [
			'110100101011', '101100101011', '110110010101', '101001101011',
			'110100110101', '101100110101', '101001011011', '110100101101',
			'101100101101', '101001101101', '110101001011', '101101001011',
			'110110100101', '101011001011', '110101100101', '101101100101',
			'101010011011', '110101001101', '101101001101', '101011001101',
			'110101010011', '101101010011', '110110101001', '101011010011',
			'110101101001', '101101101001', '101010110011', '110101011001',
			'101101011001', '101011011001', '110010101011', '100110101011',
			'110011010101', '100101101011', '110010110101', '100110110101',
			'100101011011', '110010101101', '100110101101', '100101101101',
			'100100100101', '100100101001', '100101001001', '101001001001',
		];
	}

	static get SYMBOL_SEPARATOR_PATTERN() {
		return '0';
	}

	static get QUIET_ZONE() {
		return 10;
	}
};

define_barcode_element('code-39', Code_39);
function replace_characters(string, replacements) {
	return string.split('').map(function(character) {
		return (replacements.hasOwnProperty(character) ? replacements[character] : character);
	}).join('');
}

function reverse(string) {
	return string.split('').reverse().join('');
}

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

class EAN_13 extends EAN_Like_Barcode {
	static data_to_pattern(data) {
		let data_without_check_digit = data.slice(0, 12);
		data = `${data_without_check_digit}${this.compute_check_digit(data_without_check_digit)}`;
		return [this.SIDE_PATTERN, this.encode_digits(data.slice(1, 7), this.digit_to_pattern_types(data[0])), this.MIDDLE_PATTERN, this.encode_digits(data.slice(7, 13), 'RRRRRR'), this.SIDE_PATTERN].join('');
	}
};

define_barcode_element('ean-13', EAN_13);
class EAN_8 extends EAN_Like_Barcode {
	static data_to_pattern(data) {
		let data_without_check_digit = data.slice(0, 7);
		data = `${data_without_check_digit}${this.compute_check_digit(data_without_check_digit)}`;
		return [this.SIDE_PATTERN, this.encode_digits(data.slice(0, 4), 'OOOO'), this.MIDDLE_PATTERN, this.encode_digits(data.slice(4, 8), 'RRRR'), this.SIDE_PATTERN].join('');
	}
};

define_barcode_element('ean-8', EAN_8);
class Barcode_2D extends Barcode {
};

//---------------------------------------------------------------------
// Slightly modified version of:
// https://github.com/kazuhikoarase/qrcode-generator
//---------------------------------------------------------------------
var qrcode = function() {
	//---------------------------------------------------------------------
	// qrcode
	//---------------------------------------------------------------------
	/**
	 * qrcode
	 * @param typeNumber 1 to 40
	 * @param errorCorrectionLevel 'L','M','Q','H'
	 */
	var qrcode = function(typeNumber, errorCorrectionLevel) {
		var PAD0 = 0xEC;
		var PAD1 = 0x11;
		var _typeNumber = typeNumber;
		var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
		var _modules = null;
		var _moduleCount = 0;
		var _dataCache = null;
		var _dataList = [];
		var _this = {};
		var makeImpl = function(test, maskPattern) {
			_moduleCount = _typeNumber * 4 + 17;
			_modules = function(moduleCount) {
				var modules = new Array(moduleCount);
				for (var row = 0; row < moduleCount; row += 1) {
					modules[row] = new Array(moduleCount);
					for (var col = 0; col < moduleCount; col += 1) {
						modules[row][col] = null;
					}
				}
				return modules;
			}(_moduleCount);
			setupPositionProbePattern(0, 0);
			setupPositionProbePattern(_moduleCount - 7, 0);
			setupPositionProbePattern(0, _moduleCount - 7);
			setupPositionAdjustPattern();
			setupTimingPattern();
			setupTypeInfo(test, maskPattern);
			if (_typeNumber >= 7) {
				setupTypeNumber(test);
			}
			if (_dataCache == null) {
				_dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
			}
			mapData(_dataCache, maskPattern);
		};
		var setupPositionProbePattern = function(row, col) {
			for (var r = -1; r <= 7; r += 1) {
				if (row + r <= -1 || _moduleCount <= row + r) continue;
				for (var c = -1; c <= 7; c += 1) {
					if (col + c <= -1 || _moduleCount <= col + c) continue;
					if ((0 <= r && r <= 6 && (c == 0 || c == 6)) || (0 <= c && c <= 6 && (r == 0 || r == 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
						_modules[row + r][col + c] = true;
					} else {
						_modules[row + r][col + c] = false;
					}
				}
			}
		};
		var getBestMaskPattern = function() {
			var minLostPoint = 0;
			var pattern = 0;
			for (var i = 0; i < 8; i += 1) {
				makeImpl(true, i);
				var lostPoint = QRUtil.getLostPoint(_this);
				if (i == 0 || minLostPoint > lostPoint) {
					minLostPoint = lostPoint;
					pattern = i;
				}
			}
			return pattern;
		};
		var setupTimingPattern = function() {
			for (var r = 8; r < _moduleCount - 8; r += 1) {
				if (_modules[r][6] != null) {
					continue;
				}
				_modules[r][6] = (r % 2 == 0);
			}
			for (var c = 8; c < _moduleCount - 8; c += 1) {
				if (_modules[6][c] != null) {
					continue;
				}
				_modules[6][c] = (c % 2 == 0);
			}
		};
		var setupPositionAdjustPattern = function() {
			var pos = QRUtil.getPatternPosition(_typeNumber);
			for (var i = 0; i < pos.length; i += 1) {
				for (var j = 0; j < pos.length; j += 1) {
					var row = pos[i];
					var col = pos[j];
					if (_modules[row][col] != null) {
						continue;
					}
					for (var r = -2; r <= 2; r += 1) {
						for (var c = -2; c <= 2; c += 1) {
							if (r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0)) {
								_modules[row + r][col + c] = true;
							} else {
								_modules[row + r][col + c] = false;
							}
						}
					}
				}
			}
		};
		var setupTypeNumber = function(test) {
			var bits = QRUtil.getBCHTypeNumber(_typeNumber);
			for (var i = 0; i < 18; i += 1) {
				var mod = (!test && ((bits >> i) & 1) == 1);
				_modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
			}
			for (var i = 0; i < 18; i += 1) {
				var mod = (!test && ((bits >> i) & 1) == 1);
				_modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
			}
		};
		var setupTypeInfo = function(test, maskPattern) {
			var data = (_errorCorrectionLevel << 3) | maskPattern;
			var bits = QRUtil.getBCHTypeInfo(data);
			// vertical
			for (var i = 0; i < 15; i += 1) {
				var mod = (!test && ((bits >> i) & 1) == 1);
				if (i < 6) {
					_modules[i][8] = mod;
				} else if (i < 8) {
					_modules[i + 1][8] = mod;
				} else {
					_modules[_moduleCount - 15 + i][8] = mod;
				}
			}
			// horizontal
			for (var i = 0; i < 15; i += 1) {
				var mod = (!test && ((bits >> i) & 1) == 1);
				if (i < 8) {
					_modules[8][_moduleCount - i - 1] = mod;
				} else if (i < 9) {
					_modules[8][15 - i - 1 + 1] = mod;
				} else {
					_modules[8][15 - i - 1] = mod;
				}
			}
			// fixed module
			_modules[_moduleCount - 8][8] = (!test);
		};
		var mapData = function(data, maskPattern) {
			var inc = -1;
			var row = _moduleCount - 1;
			var bitIndex = 7;
			var byteIndex = 0;
			var maskFunc = QRUtil.getMaskFunction(maskPattern);
			for (var col = _moduleCount - 1; col > 0; col -= 2) {
				if (col == 6) col -= 1;
				while (true) {
					for (var c = 0; c < 2; c += 1) {
						if (_modules[row][col - c] == null) {
							var dark = false;
							if (byteIndex < data.length) {
								dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
							}
							var mask = maskFunc(row, col - c);
							if (mask) {
								dark = !dark;
							}
							_modules[row][col - c] = dark;
							bitIndex -= 1;
							if (bitIndex == -1) {
								byteIndex += 1;
								bitIndex = 7;
							}
						}
					}
					row += inc;
					if (row < 0 || _moduleCount <= row) {
						row -= inc;
						inc = -inc;
						break;
					}
				}
			}
		};
		var createBytes = function(buffer, rsBlocks) {
			var offset = 0;
			var maxDcCount = 0;
			var maxEcCount = 0;
			var dcdata = new Array(rsBlocks.length);
			var ecdata = new Array(rsBlocks.length);
			for (var r = 0; r < rsBlocks.length; r += 1) {
				var dcCount = rsBlocks[r].dataCount;
				var ecCount = rsBlocks[r].totalCount - dcCount;
				maxDcCount = Math.max(maxDcCount, dcCount);
				maxEcCount = Math.max(maxEcCount, ecCount);
				dcdata[r] = new Array(dcCount);
				for (var i = 0; i < dcdata[r].length; i += 1) {
					dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
				}
				offset += dcCount;
				var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
				var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);
				var modPoly = rawPoly.mod(rsPoly);
				ecdata[r] = new Array(rsPoly.getLength() - 1);
				for (var i = 0; i < ecdata[r].length; i += 1) {
					var modIndex = i + modPoly.getLength() - ecdata[r].length;
					ecdata[r][i] = (modIndex >= 0) ? modPoly.getAt(modIndex) : 0;
				}
			}
			var totalCodeCount = 0;
			for (var i = 0; i < rsBlocks.length; i += 1) {
				totalCodeCount += rsBlocks[i].totalCount;
			}
			var data = new Array(totalCodeCount);
			var index = 0;
			for (var i = 0; i < maxDcCount; i += 1) {
				for (var r = 0; r < rsBlocks.length; r += 1) {
					if (i < dcdata[r].length) {
						data[index] = dcdata[r][i];
						index += 1;
					}
				}
			}
			for (var i = 0; i < maxEcCount; i += 1) {
				for (var r = 0; r < rsBlocks.length; r += 1) {
					if (i < ecdata[r].length) {
						data[index] = ecdata[r][i];
						index += 1;
					}
				}
			}
			return data;
		};
		var createData = function(typeNumber, errorCorrectionLevel, dataList) {
			var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);
			var buffer = qrBitBuffer();
			for (var i = 0; i < dataList.length; i += 1) {
				var data = dataList[i];
				buffer.put(data.getMode(), 4);
				buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber));
				data.write(buffer);
			}
			// calc num max data.
			var totalDataCount = 0;
			for (var i = 0; i < rsBlocks.length; i += 1) {
				totalDataCount += rsBlocks[i].dataCount;
			}
			if (buffer.getLengthInBits() > totalDataCount * 8) {
				throw 'code length overflow. (' + buffer.getLengthInBits() + '>' + totalDataCount * 8 + ')';
			}
			// end code
			if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
				buffer.put(0, 4);
			}
			// padding
			while (buffer.getLengthInBits() % 8 != 0) {
				buffer.putBit(false);
			}
			// padding
			while (true) {
				if (buffer.getLengthInBits() >= totalDataCount * 8) {
					break;
				}
				buffer.put(PAD0, 8);
				if (buffer.getLengthInBits() >= totalDataCount * 8) {
					break;
				}
				buffer.put(PAD1, 8);
			}
			return createBytes(buffer, rsBlocks);
		};
		_this.addData = function(data, mode) {
			mode = mode || 'Byte';
			var newData = null;
			switch (mode) {
				case 'Numeric':
					newData = qrNumber(data);
					break;
				case 'Alphanumeric':
					newData = qrAlphaNum(data);
					break;
				case 'Byte':
					newData = qr8BitByte(data);
					break;
				case 'Kanji':
					newData = qrKanji(data);
					break;
				default:
					throw 'mode:' + mode;
			}
			_dataList.push(newData);
			_dataCache = null;
		};
		_this.isDark = function(row, col) {
			if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
				throw row + ',' + col;
			}
			return _modules[row][col];
		};
		_this.getModuleCount = function() {
			return _moduleCount;
		};
		_this.make = function() {
			if (_typeNumber < 1) {
				var typeNumber = 1;
				for (; typeNumber < 40; typeNumber++) {
					var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
					var buffer = qrBitBuffer();
					for (var i = 0; i < _dataList.length; i++) {
						var data = _dataList[i];
						buffer.put(data.getMode(), 4);
						buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber));
						data.write(buffer);
					}
					var totalDataCount = 0;
					for (var i = 0; i < rsBlocks.length; i++) {
						totalDataCount += rsBlocks[i].dataCount;
					}
					if (buffer.getLengthInBits() <= totalDataCount * 8) {
						break;
					}
				}
				_typeNumber = typeNumber;
			}
			makeImpl(false, getBestMaskPattern());
		};
		return _this;
	};
	//---------------------------------------------------------------------
	// qrcode.stringToBytes
	//---------------------------------------------------------------------
	qrcode.stringToBytesFuncs = {
		'default': function(s) {
			var bytes = [];
			for (var i = 0; i < s.length; i += 1) {
				var c = s.charCodeAt(i);
				bytes.push(c & 0xff);
			}
			return bytes;
		}
	};
	qrcode.stringToBytes = qrcode.stringToBytesFuncs['default'];
	//---------------------------------------------------------------------
	// qrcode.createStringToBytes
	//---------------------------------------------------------------------
	/**
	 * @param unicodeData base64 string of byte array.
	 * [16bit Unicode],[16bit Bytes], ...
	 * @param numChars
	 */
	qrcode.createStringToBytes = function(unicodeData, numChars) {
		// create conversion map.
		var unicodeMap = function() {
			var bin = base64DecodeInputStream(unicodeData);
			var read = function() {
				var b = bin.read();
				if (b == -1) throw 'eof';
				return b;
			};
			var count = 0;
			var unicodeMap = {};
			while (true) {
				var b0 = bin.read();
				if (b0 == -1) break;
				var b1 = read();
				var b2 = read();
				var b3 = read();
				var k = String.fromCharCode((b0 << 8) | b1);
				var v = (b2 << 8) | b3;
				unicodeMap[k] = v;
				count += 1;
			}
			if (count != numChars) {
				throw count + ' != ' + numChars;
			}
			return unicodeMap;
		}();
		var unknownChar = '?'.charCodeAt(0);
		return function(s) {
			var bytes = [];
			for (var i = 0; i < s.length; i += 1) {
				var c = s.charCodeAt(i);
				if (c < 128) {
					bytes.push(c);
				} else {
					var b = unicodeMap[s.charAt(i)];
					if (typeof b == 'number') {
						if ((b & 0xff) == b) {
							// 1byte
							bytes.push(b);
						} else {
							// 2bytes
							bytes.push(b >>> 8);
							bytes.push(b & 0xff);
						}
					} else {
						bytes.push(unknownChar);
					}
				}
			}
			return bytes;
		};
	};
	//---------------------------------------------------------------------
	// QRMode
	//---------------------------------------------------------------------
	var QRMode = {
		MODE_NUMBER: 1 << 0,
		MODE_ALPHA_NUM: 1 << 1,
		MODE_8BIT_BYTE: 1 << 2,
		MODE_KANJI: 1 << 3
	};
	//---------------------------------------------------------------------
	// QRErrorCorrectionLevel
	//---------------------------------------------------------------------
	var QRErrorCorrectionLevel = {
		L: 1,
		M: 0,
		Q: 3,
		H: 2
	};
	//---------------------------------------------------------------------
	// QRMaskPattern
	//---------------------------------------------------------------------
	var QRMaskPattern = {
		PATTERN000: 0,
		PATTERN001: 1,
		PATTERN010: 2,
		PATTERN011: 3,
		PATTERN100: 4,
		PATTERN101: 5,
		PATTERN110: 6,
		PATTERN111: 7
	};
	//---------------------------------------------------------------------
	// QRUtil
	//---------------------------------------------------------------------
	var QRUtil = function() {
		var PATTERN_POSITION_TABLE = [
			[],
			[6, 18],
			[6, 22],
			[6, 26],
			[6, 30],
			[6, 34],
			[6, 22, 38],
			[6, 24, 42],
			[6, 26, 46],
			[6, 28, 50],
			[6, 30, 54],
			[6, 32, 58],
			[6, 34, 62],
			[6, 26, 46, 66],
			[6, 26, 48, 70],
			[6, 26, 50, 74],
			[6, 30, 54, 78],
			[6, 30, 56, 82],
			[6, 30, 58, 86],
			[6, 34, 62, 90],
			[6, 28, 50, 72, 94],
			[6, 26, 50, 74, 98],
			[6, 30, 54, 78, 102],
			[6, 28, 54, 80, 106],
			[6, 32, 58, 84, 110],
			[6, 30, 58, 86, 114],
			[6, 34, 62, 90, 118],
			[6, 26, 50, 74, 98, 122],
			[6, 30, 54, 78, 102, 126],
			[6, 26, 52, 78, 104, 130],
			[6, 30, 56, 82, 108, 134],
			[6, 34, 60, 86, 112, 138],
			[6, 30, 58, 86, 114, 142],
			[6, 34, 62, 90, 118, 146],
			[6, 30, 54, 78, 102, 126, 150],
			[6, 24, 50, 76, 102, 128, 154],
			[6, 28, 54, 80, 106, 132, 158],
			[6, 32, 58, 84, 110, 136, 162],
			[6, 26, 54, 82, 110, 138, 166],
			[6, 30, 58, 86, 114, 142, 170]
		];
		var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
		var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
		var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);
		var _this = {};
		var getBCHDigit = function(data) {
			var digit = 0;
			while (data != 0) {
				digit += 1;
				data >>>= 1;
			}
			return digit;
		};
		_this.getBCHTypeInfo = function(data) {
			var d = data << 10;
			while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
				d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15)));
			}
			return ((data << 10) | d) ^ G15_MASK;
		};
		_this.getBCHTypeNumber = function(data) {
			var d = data << 12;
			while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
				d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18)));
			}
			return (data << 12) | d;
		};
		_this.getPatternPosition = function(typeNumber) {
			return PATTERN_POSITION_TABLE[typeNumber - 1];
		};
		_this.getMaskFunction = function(maskPattern) {
			switch (maskPattern) {
				case QRMaskPattern.PATTERN000:
					return function(i, j) {
						return (i + j) % 2 == 0;
					};
				case QRMaskPattern.PATTERN001:
					return function(i, j) {
						return i % 2 == 0;
					};
				case QRMaskPattern.PATTERN010:
					return function(i, j) {
						return j % 3 == 0;
					};
				case QRMaskPattern.PATTERN011:
					return function(i, j) {
						return (i + j) % 3 == 0;
					};
				case QRMaskPattern.PATTERN100:
					return function(i, j) {
						return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
					};
				case QRMaskPattern.PATTERN101:
					return function(i, j) {
						return (i * j) % 2 + (i * j) % 3 == 0;
					};
				case QRMaskPattern.PATTERN110:
					return function(i, j) {
						return ((i * j) % 2 + (i * j) % 3) % 2 == 0;
					};
				case QRMaskPattern.PATTERN111:
					return function(i, j) {
						return ((i * j) % 3 + (i + j) % 2) % 2 == 0;
					};
				default:
					throw 'bad maskPattern:' + maskPattern;
			}
		};
		_this.getErrorCorrectPolynomial = function(errorCorrectLength) {
			var a = qrPolynomial([1], 0);
			for (var i = 0; i < errorCorrectLength; i += 1) {
				a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0));
			}
			return a;
		};
		_this.getLengthInBits = function(mode, type) {
			if (1 <= type && type < 10) {
				// 1 - 9
				switch (mode) {
					case QRMode.MODE_NUMBER:
						return 10;
					case QRMode.MODE_ALPHA_NUM:
						return 9;
					case QRMode.MODE_8BIT_BYTE:
						return 8;
					case QRMode.MODE_KANJI:
						return 8;
					default:
						throw 'mode:' + mode;
				}
			} else if (type < 27) {
				// 10 - 26
				switch (mode) {
					case QRMode.MODE_NUMBER:
						return 12;
					case QRMode.MODE_ALPHA_NUM:
						return 11;
					case QRMode.MODE_8BIT_BYTE:
						return 16;
					case QRMode.MODE_KANJI:
						return 10;
					default:
						throw 'mode:' + mode;
				}
			} else if (type < 41) {
				// 27 - 40
				switch (mode) {
					case QRMode.MODE_NUMBER:
						return 14;
					case QRMode.MODE_ALPHA_NUM:
						return 13;
					case QRMode.MODE_8BIT_BYTE:
						return 16;
					case QRMode.MODE_KANJI:
						return 12;
					default:
						throw 'mode:' + mode;
				}
			} else {
				throw 'type:' + type;
			}
		};
		_this.getLostPoint = function(qrcode) {
			var moduleCount = qrcode.getModuleCount();
			var lostPoint = 0;
			// LEVEL1
			for (var row = 0; row < moduleCount; row += 1) {
				for (var col = 0; col < moduleCount; col += 1) {
					var sameCount = 0;
					var dark = qrcode.isDark(row, col);
					for (var r = -1; r <= 1; r += 1) {
						if (row + r < 0 || moduleCount <= row + r) {
							continue;
						}
						for (var c = -1; c <= 1; c += 1) {
							if (col + c < 0 || moduleCount <= col + c) {
								continue;
							}
							if (r == 0 && c == 0) {
								continue;
							}
							if (dark == qrcode.isDark(row + r, col + c)) {
								sameCount += 1;
							}
						}
					}
					if (sameCount > 5) {
						lostPoint += (3 + sameCount - 5);
					}
				}
			};
			// LEVEL2
			for (var row = 0; row < moduleCount - 1; row += 1) {
				for (var col = 0; col < moduleCount - 1; col += 1) {
					var count = 0;
					if (qrcode.isDark(row, col)) count += 1;
					if (qrcode.isDark(row + 1, col)) count += 1;
					if (qrcode.isDark(row, col + 1)) count += 1;
					if (qrcode.isDark(row + 1, col + 1)) count += 1;
					if (count == 0 || count == 4) {
						lostPoint += 3;
					}
				}
			}
			// LEVEL3
			for (var row = 0; row < moduleCount; row += 1) {
				for (var col = 0; col < moduleCount - 6; col += 1) {
					if (qrcode.isDark(row, col) && !qrcode.isDark(row, col + 1) && qrcode.isDark(row, col + 2) && qrcode.isDark(row, col + 3) && qrcode.isDark(row, col + 4) && !qrcode.isDark(row, col + 5) && qrcode.isDark(row, col + 6)) {
						lostPoint += 40;
					}
				}
			}
			for (var col = 0; col < moduleCount; col += 1) {
				for (var row = 0; row < moduleCount - 6; row += 1) {
					if (qrcode.isDark(row, col) && !qrcode.isDark(row + 1, col) && qrcode.isDark(row + 2, col) && qrcode.isDark(row + 3, col) && qrcode.isDark(row + 4, col) && !qrcode.isDark(row + 5, col) && qrcode.isDark(row + 6, col)) {
						lostPoint += 40;
					}
				}
			}
			// LEVEL4
			var darkCount = 0;
			for (var col = 0; col < moduleCount; col += 1) {
				for (var row = 0; row < moduleCount; row += 1) {
					if (qrcode.isDark(row, col)) {
						darkCount += 1;
					}
				}
			}
			var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
			lostPoint += ratio * 10;
			return lostPoint;
		};
		return _this;
	}();
	//---------------------------------------------------------------------
	// QRMath
	//---------------------------------------------------------------------
	var QRMath = function() {
		var EXP_TABLE = new Array(256);
		var LOG_TABLE = new Array(256);
		// initialize tables
		for (var i = 0; i < 8; i += 1) {
			EXP_TABLE[i] = 1 << i;
		}
		for (var i = 8; i < 256; i += 1) {
			EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
		}
		for (var i = 0; i < 255; i += 1) {
			LOG_TABLE[EXP_TABLE[i]] = i;
		}
		var _this = {};
		_this.glog = function(n) {
			if (n < 1) {
				throw 'glog(' + n + ')';
			}
			return LOG_TABLE[n];
		};
		_this.gexp = function(n) {
			while (n < 0) {
				n += 255;
			}
			while (n >= 256) {
				n -= 255;
			}
			return EXP_TABLE[n];
		};
		return _this;
	}();
	//---------------------------------------------------------------------
	// qrPolynomial
	//---------------------------------------------------------------------
	function qrPolynomial(num, shift) {
		if (typeof num.length == 'undefined') {
			throw num.length + '/' + shift;
		}
		var _num = function() {
			var offset = 0;
			while (offset < num.length && num[offset] == 0) {
				offset += 1;
			}
			var _num = new Array(num.length - offset + shift);
			for (var i = 0; i < num.length - offset; i += 1) {
				_num[i] = num[i + offset];
			}
			return _num;
		}();
		var _this = {};
		_this.getAt = function(index) {
			return _num[index];
		};
		_this.getLength = function() {
			return _num.length;
		};
		_this.multiply = function(e) {
			var num = new Array(_this.getLength() + e.getLength() - 1);
			for (var i = 0; i < _this.getLength(); i += 1) {
				for (var j = 0; j < e.getLength(); j += 1) {
					num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i)) + QRMath.glog(e.getAt(j)));
				}
			}
			return qrPolynomial(num, 0);
		};
		_this.mod = function(e) {
			if (_this.getLength() - e.getLength() < 0) {
				return _this;
			}
			var ratio = QRMath.glog(_this.getAt(0)) - QRMath.glog(e.getAt(0));
			var num = new Array(_this.getLength());
			for (var i = 0; i < _this.getLength(); i += 1) {
				num[i] = _this.getAt(i);
			}
			for (var i = 0; i < e.getLength(); i += 1) {
				num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i)) + ratio);
			}
			// recursive call
			return qrPolynomial(num, 0).mod(e);
		};
		return _this;
	};
	//---------------------------------------------------------------------
	// QRRSBlock
	//---------------------------------------------------------------------
	var QRRSBlock = function() {
		var RS_BLOCK_TABLE = [
			// L
			// M
			// Q
			// H
			// 1
			[1, 26, 19],
			[1, 26, 16],
			[1, 26, 13],
			[1, 26, 9],
			// 2
			[1, 44, 34],
			[1, 44, 28],
			[1, 44, 22],
			[1, 44, 16],
			// 3
			[1, 70, 55],
			[1, 70, 44],
			[2, 35, 17],
			[2, 35, 13],
			// 4
			[1, 100, 80],
			[2, 50, 32],
			[2, 50, 24],
			[4, 25, 9],
			// 5
			[1, 134, 108],
			[2, 67, 43],
			[2, 33, 15, 2, 34, 16],
			[2, 33, 11, 2, 34, 12],
			// 6
			[2, 86, 68],
			[4, 43, 27],
			[4, 43, 19],
			[4, 43, 15],
			// 7
			[2, 98, 78],
			[4, 49, 31],
			[2, 32, 14, 4, 33, 15],
			[4, 39, 13, 1, 40, 14],
			// 8
			[2, 121, 97],
			[2, 60, 38, 2, 61, 39],
			[4, 40, 18, 2, 41, 19],
			[4, 40, 14, 2, 41, 15],
			// 9
			[2, 146, 116],
			[3, 58, 36, 2, 59, 37],
			[4, 36, 16, 4, 37, 17],
			[4, 36, 12, 4, 37, 13],
			// 10
			[2, 86, 68, 2, 87, 69],
			[4, 69, 43, 1, 70, 44],
			[6, 43, 19, 2, 44, 20],
			[6, 43, 15, 2, 44, 16],
			// 11
			[4, 101, 81],
			[1, 80, 50, 4, 81, 51],
			[4, 50, 22, 4, 51, 23],
			[3, 36, 12, 8, 37, 13],
			// 12
			[2, 116, 92, 2, 117, 93],
			[6, 58, 36, 2, 59, 37],
			[4, 46, 20, 6, 47, 21],
			[7, 42, 14, 4, 43, 15],
			// 13
			[4, 133, 107],
			[8, 59, 37, 1, 60, 38],
			[8, 44, 20, 4, 45, 21],
			[12, 33, 11, 4, 34, 12],
			// 14
			[3, 145, 115, 1, 146, 116],
			[4, 64, 40, 5, 65, 41],
			[11, 36, 16, 5, 37, 17],
			[11, 36, 12, 5, 37, 13],
			// 15
			[5, 109, 87, 1, 110, 88],
			[5, 65, 41, 5, 66, 42],
			[5, 54, 24, 7, 55, 25],
			[11, 36, 12, 7, 37, 13],
			// 16
			[5, 122, 98, 1, 123, 99],
			[7, 73, 45, 3, 74, 46],
			[15, 43, 19, 2, 44, 20],
			[3, 45, 15, 13, 46, 16],
			// 17
			[1, 135, 107, 5, 136, 108],
			[10, 74, 46, 1, 75, 47],
			[1, 50, 22, 15, 51, 23],
			[2, 42, 14, 17, 43, 15],
			// 18
			[5, 150, 120, 1, 151, 121],
			[9, 69, 43, 4, 70, 44],
			[17, 50, 22, 1, 51, 23],
			[2, 42, 14, 19, 43, 15],
			// 19
			[3, 141, 113, 4, 142, 114],
			[3, 70, 44, 11, 71, 45],
			[17, 47, 21, 4, 48, 22],
			[9, 39, 13, 16, 40, 14],
			// 20
			[3, 135, 107, 5, 136, 108],
			[3, 67, 41, 13, 68, 42],
			[15, 54, 24, 5, 55, 25],
			[15, 43, 15, 10, 44, 16],
			// 21
			[4, 144, 116, 4, 145, 117],
			[17, 68, 42],
			[17, 50, 22, 6, 51, 23],
			[19, 46, 16, 6, 47, 17],
			// 22
			[2, 139, 111, 7, 140, 112],
			[17, 74, 46],
			[7, 54, 24, 16, 55, 25],
			[34, 37, 13],
			// 23
			[4, 151, 121, 5, 152, 122],
			[4, 75, 47, 14, 76, 48],
			[11, 54, 24, 14, 55, 25],
			[16, 45, 15, 14, 46, 16],
			// 24
			[6, 147, 117, 4, 148, 118],
			[6, 73, 45, 14, 74, 46],
			[11, 54, 24, 16, 55, 25],
			[30, 46, 16, 2, 47, 17],
			// 25
			[8, 132, 106, 4, 133, 107],
			[8, 75, 47, 13, 76, 48],
			[7, 54, 24, 22, 55, 25],
			[22, 45, 15, 13, 46, 16],
			// 26
			[10, 142, 114, 2, 143, 115],
			[19, 74, 46, 4, 75, 47],
			[28, 50, 22, 6, 51, 23],
			[33, 46, 16, 4, 47, 17],
			// 27
			[8, 152, 122, 4, 153, 123],
			[22, 73, 45, 3, 74, 46],
			[8, 53, 23, 26, 54, 24],
			[12, 45, 15, 28, 46, 16],
			// 28
			[3, 147, 117, 10, 148, 118],
			[3, 73, 45, 23, 74, 46],
			[4, 54, 24, 31, 55, 25],
			[11, 45, 15, 31, 46, 16],
			// 29
			[7, 146, 116, 7, 147, 117],
			[21, 73, 45, 7, 74, 46],
			[1, 53, 23, 37, 54, 24],
			[19, 45, 15, 26, 46, 16],
			// 30
			[5, 145, 115, 10, 146, 116],
			[19, 75, 47, 10, 76, 48],
			[15, 54, 24, 25, 55, 25],
			[23, 45, 15, 25, 46, 16],
			// 31
			[13, 145, 115, 3, 146, 116],
			[2, 74, 46, 29, 75, 47],
			[42, 54, 24, 1, 55, 25],
			[23, 45, 15, 28, 46, 16],
			// 32
			[17, 145, 115],
			[10, 74, 46, 23, 75, 47],
			[10, 54, 24, 35, 55, 25],
			[19, 45, 15, 35, 46, 16],
			// 33
			[17, 145, 115, 1, 146, 116],
			[14, 74, 46, 21, 75, 47],
			[29, 54, 24, 19, 55, 25],
			[11, 45, 15, 46, 46, 16],
			// 34
			[13, 145, 115, 6, 146, 116],
			[14, 74, 46, 23, 75, 47],
			[44, 54, 24, 7, 55, 25],
			[59, 46, 16, 1, 47, 17],
			// 35
			[12, 151, 121, 7, 152, 122],
			[12, 75, 47, 26, 76, 48],
			[39, 54, 24, 14, 55, 25],
			[22, 45, 15, 41, 46, 16],
			// 36
			[6, 151, 121, 14, 152, 122],
			[6, 75, 47, 34, 76, 48],
			[46, 54, 24, 10, 55, 25],
			[2, 45, 15, 64, 46, 16],
			// 37
			[17, 152, 122, 4, 153, 123],
			[29, 74, 46, 14, 75, 47],
			[49, 54, 24, 10, 55, 25],
			[24, 45, 15, 46, 46, 16],
			// 38
			[4, 152, 122, 18, 153, 123],
			[13, 74, 46, 32, 75, 47],
			[48, 54, 24, 14, 55, 25],
			[42, 45, 15, 32, 46, 16],
			// 39
			[20, 147, 117, 4, 148, 118],
			[40, 75, 47, 7, 76, 48],
			[43, 54, 24, 22, 55, 25],
			[10, 45, 15, 67, 46, 16],
			// 40
			[19, 148, 118, 6, 149, 119],
			[18, 75, 47, 31, 76, 48],
			[34, 54, 24, 34, 55, 25],
			[20, 45, 15, 61, 46, 16]
		];
		var qrRSBlock = function(totalCount, dataCount) {
			var _this = {};
			_this.totalCount = totalCount;
			_this.dataCount = dataCount;
			return _this;
		};
		var _this = {};
		var getRsBlockTable = function(typeNumber, errorCorrectionLevel) {
			switch (errorCorrectionLevel) {
				case QRErrorCorrectionLevel.L:
					return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
				case QRErrorCorrectionLevel.M:
					return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
				case QRErrorCorrectionLevel.Q:
					return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
				case QRErrorCorrectionLevel.H:
					return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
				default:
					return undefined;
			}
		};
		_this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {
			var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);
			if (typeof rsBlock == 'undefined') {
				throw 'bad rs block @ typeNumber:' + typeNumber + '/errorCorrectionLevel:' + errorCorrectionLevel;
			}
			var length = rsBlock.length / 3;
			var list = [];
			for (var i = 0; i < length; i += 1) {
				var count = rsBlock[i * 3 + 0];
				var totalCount = rsBlock[i * 3 + 1];
				var dataCount = rsBlock[i * 3 + 2];
				for (var j = 0; j < count; j += 1) {
					list.push(qrRSBlock(totalCount, dataCount));
				}
			}
			return list;
		};
		return _this;
	}();
	//---------------------------------------------------------------------
	// qrBitBuffer
	//---------------------------------------------------------------------
	var qrBitBuffer = function() {
		var _buffer = [];
		var _length = 0;
		var _this = {};
		_this.getBuffer = function() {
			return _buffer;
		};
		_this.getAt = function(index) {
			var bufIndex = Math.floor(index / 8);
			return ((_buffer[bufIndex] >>> (7 - index % 8)) & 1) == 1;
		};
		_this.put = function(num, length) {
			for (var i = 0; i < length; i += 1) {
				_this.putBit(((num >>> (length - i - 1)) & 1) == 1);
			}
		};
		_this.getLengthInBits = function() {
			return _length;
		};
		_this.putBit = function(bit) {
			var bufIndex = Math.floor(_length / 8);
			if (_buffer.length <= bufIndex) {
				_buffer.push(0);
			}
			if (bit) {
				_buffer[bufIndex] |= (0x80 >>> (_length % 8));
			}
			_length += 1;
		};
		return _this;
	};
	//---------------------------------------------------------------------
	// qrNumber
	//---------------------------------------------------------------------
	var qrNumber = function(data) {
		var _mode = QRMode.MODE_NUMBER;
		var _data = data;
		var _this = {};
		_this.getMode = function() {
			return _mode;
		};
		_this.getLength = function(buffer) {
			return _data.length;
		};
		_this.write = function(buffer) {
			var data = _data;
			var i = 0;
			while (i + 2 < data.length) {
				buffer.put(strToNum(data.substring(i, i + 3)), 10);
				i += 3;
			}
			if (i < data.length) {
				if (data.length - i == 1) {
					buffer.put(strToNum(data.substring(i, i + 1)), 4);
				} else if (data.length - i == 2) {
					buffer.put(strToNum(data.substring(i, i + 2)), 7);
				}
			}
		};
		var strToNum = function(s) {
			var num = 0;
			for (var i = 0; i < s.length; i += 1) {
				num = num * 10 + chatToNum(s.charAt(i));
			}
			return num;
		};
		var chatToNum = function(c) {
			if ('0' <= c && c <= '9') {
				return c.charCodeAt(0) - '0'.charCodeAt(0);
			}
			throw 'illegal char :' + c;
		};
		return _this;
	};
	//---------------------------------------------------------------------
	// qrAlphaNum
	//---------------------------------------------------------------------
	var qrAlphaNum = function(data) {
		var _mode = QRMode.MODE_ALPHA_NUM;
		var _data = data;
		var _this = {};
		_this.getMode = function() {
			return _mode;
		};
		_this.getLength = function(buffer) {
			return _data.length;
		};
		_this.write = function(buffer) {
			var s = _data;
			var i = 0;
			while (i + 1 < s.length) {
				buffer.put(getCode(s.charAt(i)) * 45 + getCode(s.charAt(i + 1)), 11);
				i += 2;
			}
			if (i < s.length) {
				buffer.put(getCode(s.charAt(i)), 6);
			}
		};
		var getCode = function(c) {
			if ('0' <= c && c <= '9') {
				return c.charCodeAt(0) - '0'.charCodeAt(0);
			} else if ('A' <= c && c <= 'Z') {
				return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
			} else {
				switch (c) {
					case ' ':
						return 36;
					case '$':
						return 37;
					case '%':
						return 38;
					case '*':
						return 39;
					case '+':
						return 40;
					case '-':
						return 41;
					case '.':
						return 42;
					case '/':
						return 43;
					case ':':
						return 44;
					default:
						throw 'illegal char :' + c;
				}
			}
		};
		return _this;
	};
	//---------------------------------------------------------------------
	// qr8BitByte
	//---------------------------------------------------------------------
	var qr8BitByte = function(data) {
		var _mode = QRMode.MODE_8BIT_BYTE;
		var _data = data;
		var _bytes = qrcode.stringToBytes(data);
		var _this = {};
		_this.getMode = function() {
			return _mode;
		};
		_this.getLength = function(buffer) {
			return _bytes.length;
		};
		_this.write = function(buffer) {
			for (var i = 0; i < _bytes.length; i += 1) {
				buffer.put(_bytes[i], 8);
			}
		};
		return _this;
	};
	//---------------------------------------------------------------------
	// qrKanji
	//---------------------------------------------------------------------
	var qrKanji = function(data) {
		var _mode = QRMode.MODE_KANJI;
		var _data = data;
		var stringToBytes = qrcode.stringToBytesFuncs['SJIS'];
		if (!stringToBytes) {
			throw 'sjis not supported.';
		}! function(c, code) {
			// self test for sjis support.
			var test = stringToBytes(c);
			if (test.length != 2 || ((test[0] << 8) | test[1]) != code) {
				throw 'sjis not supported.';
			}
		}('\u53cb', 0x9746);
		var _bytes = stringToBytes(data);
		var _this = {};
		_this.getMode = function() {
			return _mode;
		};
		_this.getLength = function(buffer) {
			return ~~(_bytes.length / 2);
		};
		_this.write = function(buffer) {
			var data = _bytes;
			var i = 0;
			while (i + 1 < data.length) {
				var c = ((0xff & data[i]) << 8) | (0xff & data[i + 1]);
				if (0x8140 <= c && c <= 0x9FFC) {
					c -= 0x8140;
				} else if (0xE040 <= c && c <= 0xEBBF) {
					c -= 0xC140;
				} else {
					throw 'illegal char at ' + (i + 1) + '/' + c;
				}
				c = ((c >>> 8) & 0xff) * 0xC0 + (c & 0xff);
				buffer.put(c, 13);
				i += 2;
			}
			if (i < data.length) {
				throw 'illegal char at ' + (i + 1);
			}
		};
		return _this;
	};
	//---------------------------------------------------------------------
	// returns qrcode function.
	return qrcode;
}();
// multibyte support
! function() {
	qrcode.stringToBytesFuncs['UTF-8'] = function(s) {
		// http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
		function toUTF8Array(str) {
			var utf8 = [];
			for (var i = 0; i < str.length; i++) {
				var charcode = str.charCodeAt(i);
				if (charcode < 0x80) utf8.push(charcode);
				else if (charcode < 0x800) {
					utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
				} else if (charcode < 0xd800 || charcode >= 0xe000) {
					utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
				}
				// surrogate pair
				else {
					i++;
					// UTF-16 encodes 0x10000-0x10FFFF by
					// subtracting 0x10000 and splitting the
					// 20 bits of 0x0-0xFFFFF into two halves
					charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
					utf8.push(0xf0 | (charcode >> 18), 0x80 | ((charcode >> 12) & 0x3f), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
				}
			}
			return utf8;
		}
		return toUTF8Array(s);
	};
}();

function create_qrcode(data, error_correction_level, type) {
	error_correction_level = value_with_default(error_correction_level, 'L');
	type = value_with_default(type, 0);
	for (mode of ['Numeric', 'Alphanumeric', 'Byte', 'Kanji']) {
		try {
			let qr = qrcode(type, error_correction_level);
			qr.addData(data, mode);
			qr.make();
			return qr;
		} catch (error) {
		}
	}
	throw Error('Unable to encode data');
}

class QR_Code extends Barcode_2D {
	static data_to_row_patterns(data) {
		let qr = create_qrcode(data);
		let array = Array(qr.getModuleCount()).fill(0);
		return array.map(function(a, y) {
			return array.map(function(b, x) {
				return (qr.isDark(y, x) ? '1' : '0');
			}).join('');
		});
	}

	static get QUIET_ZONE() {
		return 4;
	}
};

define_barcode_element('qr-code', QR_Code);
}).call(this);

