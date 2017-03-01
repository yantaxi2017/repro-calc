function add_alert (alert_class, message) {
	$('.alerts').append('<div class="alert alert-' + alert_class + '" role="alert">' + message + '</div>');
}

function clear_alerts () {
	$('.alerts').empty();
}

function get_total (sector) {
	return sector['c'] + sector['v'] + sector['m'];
}

function sector_to_s (sector) {
	return sector['c'] + 'c + ' + sector['v'] + 'v + ' + sector['m'] + 'm = ' + get_total(sector);
}

// 분수 약분
// 분모가 0일 경우 null을 반환
function reduceFraction (numerator, denominator) {
	if (denominator == 0) { // 분모는 0이 될 수 없음
		return null;
	}

	gcd_result = gcd(numerator, denominator);

	numerator = numerator / gcd_result;
	denominator = denominator / gcd_result;

	return [numerator, denominator];
}

// get gcd: Greatest Common Divisor
function gcd (a, b) {
	while (b != 0) {
		temp = a % b;
		a = b;
		b = temp;
	}
	return Math.abs(a);
}

$(function () {
	var SECTOR_PATTERN = /^[ \t]*([0-9]+|[0-9]*\.[0-9]+)[ \t]*c[ \t]*\+[ \t]*([0-9]+|[0-9]*\.[0-9]+)[ \t]*v(?:[ \t]*\+[ \t]*([0-9]+|[0-9]*\.[0-9]+)[ \t]*m[ \t]*(?:\=[ \t]*([0-9]+|[0-9]*\.[0-9]+)[ \t]*)?)?$/;
	
	$('[data-toggle="tooltip"]').tooltip();
	
	$('#clear-results').click(function (e) {
		$('.results .result-item').remove();
		$('.results hr').remove();
	});
	
	$('.calc-box').submit(function (e) {
		e.preventDefault();
		
		var sec1_str = $('#sector1').val();
		var sec2_str = $('#sector2').val();
		
		if (!SECTOR_PATTERN.test(sec1_str)) {
			add_alert("danger", "Invalid format (I 부문)");
			return;
		}
		if (!SECTOR_PATTERN.test(sec2_str)) {
			add_alert("danger", "Invalid format (II 부문)");
			return;
		}
		
		var pattern_result = SECTOR_PATTERN.exec(sec1_str);
		var sec1 = new Object();
		sec1['c'] = parseFloat(pattern_result[1]);
		sec1['v'] = parseFloat(pattern_result[2]);
		sec1['m'] = sec1['v']; // 잉여가치 생성
		
		if (pattern_result[3]) {
			if (sec1['m'] != parseFloat(pattern_result[3])) {
				add_alert("danger", "Bv != Cm (I 부문)");
				return;
			}
		}
		if (pattern_result[4]) {
			if (get_total(sec1) != parseFloat(pattern_result[4])) {
				add_alert("danger", "Ac + Bv + Cm '!=' D (I 부문)");
				return;
			}
		}
		
		pattern_result = SECTOR_PATTERN.exec(sec2_str);
		var sec2 = new Object();
		sec2['c'] = parseFloat(pattern_result[1]);
		sec2['v'] = parseFloat(pattern_result[2]);
		sec2['m'] = sec2['v']; // 잉여가치 생성
		
		if (pattern_result[3]) {
			if (sec2['m'] != parseFloat(pattern_result[3])) {
				add_alert("danger", "Bv != Cm (II 부문)");
				return;
			}
		}
		if (pattern_result[4]) {
			if (get_total(sec2) != parseFloat(pattern_result[4])) {
				add_alert("danger", "Ac + Bv + Cm '!=' D (II 부문)");
				return;
			}
		}
		
		var mode = $('#select-mode').val();
		var repeats = $('#repeats').val();
		var skip = $(this).find('input[name="skip"]').is(":checked");
		var show_comments = $(this).find('input[name="show-comments"]').is(":checked");
		
		function comment (str) {
			if (show_comments)
				return '<div class="comment">' + str + '</div><br/>';
			else
				return '';
		}
		
		function calc_info (str) {
			return '<div class="calc-info">' + str + '</div>';
		}
		
		// input 태그의 min 속성을 지원하지 않는 구식 브라우저용
		if (repeats < 1) {
			add_alert("danger", "Repeats < 1");
			return;
		}
		
		switch (mode) {
			// 단순재생산
			case 'simple':
				add_alert("danger", "Simple mode is not yet implemented");
				break;
			// 확대재생산
			case 'expanded':
				if ($('.results .result-item').length) {
					$('.results').append('<hr/>');
				}
				
				var i;
				for(i = 0; i < repeats; i++) {
					head = '<div class="result-item">' +
						'<div class="step">[' + (i + 1) + ' 기]</div>';
					body = '';
					tail = '</div>';
					
					body += '주어진 표식:<br/>' +
						'<span class="expression">' +
							' - I : ' + sector_to_s(sec1) + '<br/>' +
							' - II: ' + sector_to_s(sec2) +
						'</span><br/>';
					
					var totals = get_total(sec1) + get_total(sec2);
					body += '생산물가치: ' + get_total(sec1) + 'I + ' + get_total(sec2) + 'II = ' + totals + '<br/>';
					
					vm1 = sec1['v'] + sec1['m'];
					vm2 = sec2['v'] + sec2['m'];
					vm_total = vm1 + vm2;
					body += '가치생산물(v+m): (Iv + Im = ' + vm1 + ') + (IIv + IIm = ' + vm2 + ') = ' + vm_total + '<br/>';
					
					// 확대재생산 조건 만족
					if (vm1 > sec2['c']) {
						body += '<br/>확대재생산이 이루어지기 위한 조건 \'I(v+m) > IIc\'을 만족합니다. (' +
							vm1 + ' > ' + sec2['c'] + ')<br/>';
						
						body += '<br/>';
						body += comment("1. 부문 I의 노동자들이 부문 II의 자본가들로부터 " + sec1['v'] + "의 소비수단을 구매합니다." +
							calc_info("[ Iv -= " + sec1['v'] + ", II -= " + sec1['v'] + ", 부문 II 자본가 수중의 화폐 += " + sec1['v'] + " ]"));
						var _1 = sec1['v'];
						sec1['v'] -= 0;
						// total2 -= _1; // XXX
					
						body += comment("2. 부문 II의 자본가들이 1.에서 얻은 화폐로 부문 I로부터 " + sec1['v'] + "v에 해당하는 생산수단을 구매합니다." +
							calc_info("[ I -= " + _1 + ", 부문 II 자본가 수중의 화폐 '" + sec1['v'] + "' 사용 ]"));
						// total1 -= _1; // XXX
					
						var _3 = sec2['c'] - _1;
						var _3_frac = reduceFraction(sec1['c'], sec1['v']);
						if (_3_frac == null) {
							_3_frac = [1, 0];
						}
						var _3_ratio = sec1['v'] / (sec1['c'] + sec1['v']);
						var _3_accum_v = (sec1['m'] - _3) * _3_ratio;
						var _3_accum_c = (sec1['m'] - _3) - _3_accum_v;
						body += comment("3. 부문 II의 자본가 수중에 부문 I에 판매할 수 있는 소비수단은 " + _3 + " (" + sec2['c'] + "IIc - " + _1 + "Iv)" +
							"밖에 남아 있지 않습니다. 때문에 부문 I의 자본가들은 잉여가치 " + sec1['m'] + " 중에서 " + _3 + "만을 개인적 소비에 충당합니다. " +
							"나머지 " + (sec1.m - _3) + "은 (지금 당장은 생산에 어떤 기술적 변화도 없다고 가정하고 있기 때문에)" +
							"본래의 불변자본 대 가변자본의 비율인 '" + _3_frac[0] + " : " + _3_frac[1] + "'의 비율로 축적합니다." +
							calc_info("[ Im -= " + _3 + ", 나머지 Im(" + (sec1['m'] - _3) + ")은 축적 => Ic += " + _3_accum_c + ", Iv += " + _3_accum_v + " ]"));
						// sec1['m'] = 0;
						sec1['c'] += _3_accum_c;
						sec1['v'] += _3_accum_v;
					
						var _4_ratio = sec2['v'] / sec2['c'];
						var _4_add_v = _3_accum_v * _4_ratio;
						var _4_accum = _3_accum_v + _4_add_v;
						body += comment("4. 그런데 3.에서 부문 I의 축적분 가운데 가변자본으로 축적되는 " + _3_accum_v + "은 임금으로 지불되는 것이기 때문에 " +
							"화폐로서 실현, 즉 판매해야 합니다. 그리고 그것을 구매하는 것은 부문 II의 자본가들입니다. " +
							"부문 II가 획득할 수 있는 생산수단의 양은 이 " + _3_accum_v + "이기 때문에, " +
							"잉여가치 " + sec2['m'] + " 가운데 " + (sec2['m'] - _4_accum) + "만을 개인적으로 소비하고 " + _4_accum + "은 축적을 위한 " +
							"재원으로 돌립니다.<br/>" +
							"참고로 " + _3_accum_v + "이 아니라 " + _4_accum + "인 이유는 추가 생산수단이 " + _3_accum_v + "일 때, " +
							"(역시 생산조건에 변화가 없다고 가정하고 있기에) 같은 불변자본 대 가변자본의 구성비율로 " + _4_add_v +
							"의 추가적인 가변자본이 필요하기 때문입니다. 쉽게 말해서 새 기계가 생기면 그 기계를 돌릴 노동자가 더 필요하다는 의미입니다." +
							calc_info("[ IIm -= " + (sec2['m'] - _4_accum) + ", 나머지 IIm(" + _4_accum + ")은 축적 => IIc += " + _3_accum_v + ", IIv += " + _4_add_v + " ]"));
						// sec2['m'] = 0;
						sec2['c'] += _3_accum_v;
						sec2['v'] += _4_add_v;
					
						// 잉여가치 생성
						sec1['m'] = sec1['v'];
						sec2['m'] = sec2['v'];
					
						body += "다음 기 (" + (i + 2) + " 기)의 생산:<br/>" +
							'<span class="expression">' +
								' - I : ' + sector_to_s(sec1) + '<br/>' +
								' - II: ' + sector_to_s(sec2) +
							'</span><br/>' +
							'전기 대비 생산물가치 +' + (get_total(sec1) + get_total(sec2) - totals);
					}
					// 확대재생산 조건 불만족
					else {
						body += '<br/><span class="error"> [!] 확대재생산이 이루어지기 위한 조건 \'I(v+m) > IIc\'을 만족하지 않습니다. (' +
							vm1 + ' <= ' + sec2['c'] + ')</span>';
					}
					
					if (!skip || i == 0 || i == (repeats - 1)) {
						$('.results').append(head + body + tail);
					}
				}
				break;
			default:
				add_alert("danger", "Please select a mode");
		}
	});
});
