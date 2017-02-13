/**
 * @fileoverview
 * Utility functions and classes for Wemos D1 mini Webserver.
 *
 *
 * @author Robert Gester
 */

 (function($){
	$.fn.tempGauge = function(options) {
		var opts = $.extend({}, $.fn.tempGauge.defaults, options),
		padding = opts.borderWidth;			
		
		var gauges = [];
		
		this.each(function(idx, item){
			gauges.push(createTempGauge(item));
		});
		
		return $(gauges);
		
		function createTempGauge(gauge){
			
			var canvas = document.createElement("canvas"),
				ctx = canvas.getContext("2d"),
				currentTempText = $(gauge).text(),
				currentTemp = (( parseFloat(currentTempText) + 0.000001) || opts.defaultTemp).toFixed(1);

			canvas.width = opts.width;
			canvas.height = opts.width * 2;// + opts.labelSize;

			if(opts.replaceHtml){
				$(gauge).replaceWith(canvas);
			}else{
				$(gauge).html(canvas);
			}

			var percentage = calculatePercentage(currentTemp, opts.minTemp, opts.maxTemp - opts.minTemp);

			ctx.lineWidth = opts.borderWidth;
			ctx.strokeStyle = opts.borderColor;
			ctx.fillStyle = opts.fillColor;
			//ctx.font = "bold " + opts.scaleSize + "px Arial ";
			ctx.textAlign = "center";
			var height = opts.width * 2 - padding * 6;
      var offsetLeft = 0; //5
      var offsetRight = 0; //5
			if(opts.showScaleLeft) { offsetLeft = 5; }
			if(opts.showScaleRight) { offsetRight = 6; }
      
			fillTempGauge(ctx, offsetLeft, padding + padding, opts.width - offsetRight, height, percentage);
			strokeTempGauge(ctx, offsetLeft, padding + padding, opts.width - offsetRight, height);

      if(opts.showScaleLeft) {
				drawScale(ctx, 0, padding * 2, opts.width, opts.width * 2 - padding, 0, percentage, opts.maxTemp, opts.minTemp, true);
			}

      if(opts.showScaleRight) {
        //drawScale(ctx, x, y, width, height, spacing, fillPercent, maxTemp, minTemp) 
        //width / 3 / 2 - opts.borderWidth
				drawScale(ctx,
        					opts.width /2 + opts.width / 3 / 2 + offsetLeft-offsetRight+2,
        					padding * 2 + 5,
                  opts.width,
                  opts.width * 2 - padding,
                  0,
                  percentage,
                  opts.maxTemp,
                  opts.minTemp,
                  false);
        console.log(opts.width / 3 / 2 - opts.borderWidth);
			}

			if (opts.showLabel) {
				ctx.fillStyle = opts.labelColor;
    	  ctx.font = "bold " + opts.labelSize + "px Arial ";
        drawLabel(ctx, offsetLeft + opts.width / 2 ,(height / 6 * 5) + opts.labelSize / 2, currentTempText);
			}
      
			return canvas;
		}
		
		function drawScale(ctx, x, y, width, height, spacing, fillPercent, maxTemp, minTemp, drawLine) {
			ctx.fillStyle = opts.scaleColor;
      ctx.font = opts.scaleSize + "px Arial ";
      //console.log(ctx);
			var longScale = 10, shortScale = 5;
			var o = calculateDrawArgs(x, y, width, height, spacing, fillPercent);
			var maxLength = height - o.offset - o.big.radius - o.small.radius;
      if (drawLine) {
			ctx.moveTo(x, y);
			ctx.lineTo(x, maxLength);
			ctx.stroke();
      }

			var drawScaleLine = function (x, y, scaleLength) {      
				ctx.moveTo(x, y);
				ctx.lineTo(x + scaleLength, y);
				ctx.stroke();
			};

			var delta = (maxLength + 0.001) / 10;
			for (var i = 0; i < 11; i++) {
				if (i % 2 === 0) {
					drawScaleLine(x, y + delta * i, longScale);
					drawLabel(ctx, x + longScale + 8, y + delta * i + 3, (maxTemp - (maxTemp - minTemp) * i/10).toString());
				} else {
					drawScaleLine(x, y + delta * i, shortScale);
					drawLabel(ctx, x + longScale + 8, y + delta * i + 3, (maxTemp - (maxTemp - minTemp) * i/10).toString());
				}
			}
		}

		function calculatePercentage(temp, mintemp, length){
			var percentage = (temp - mintemp)/ length;
			percentage = percentage > 1 ? 1 : percentage;
			percentage = percentage < 0 ? 0 : percentage;
			return percentage;
		}

		function calculateDrawArgs(x, y, width, height, spacing, fillPercent){
			var wholeCircle = Math.PI * 2;
			var smallRadius = width / 3 / 2 - spacing;
			var xSmall = x + width / 2;
			var ySmall = y + smallRadius + spacing;
			
			var bigRadius = height / 6 - spacing;
			var xBig = x + width / 2;
			var yBig = y + height / 6 * 5;
			
			var offSet = Math.sqrt((Math.pow(bigRadius, 2) - Math.pow(smallRadius / 2, 2)), 2);
			var twoThirdsLength = height / 6 * 5 - offSet - width / 3 / 2;

			var gauge = twoThirdsLength * fillPercent;
			
			var yBox = yBig - offSet - gauge;
			var xBox = xBig - width / 6 + spacing;
			var sRad = Math.asin(smallRadius / bigRadius);

			return {
				small : {x : xSmall, y : ySmall, radius : smallRadius},
				big : {x : xBig, y: yBig, radius : bigRadius},
				box : {x : xBox, y : yBox},
				offset : offSet,
				gauge : gauge,
				sRad : sRad,
				wholeCircle : wholeCircle
			};
		}
		
		function drawTemperatureGauge(ctx, x, y, width, height, spacing, fillPercent, lengthOffset) {
			var o = calculateDrawArgs(x, y, width, height, spacing, fillPercent);
			//console.log("x=" + x + " y="+ y + " width=" + width + " height=" + height);
      //console.log(o);
			ctx.beginPath();
			ctx.arc(o.small.x, o.box.y+lengthOffset, o.small.radius, 0, o.wholeCircle * -0.5, true);
			ctx.arc(o.big.x, o.big.y, o.big.radius, o.wholeCircle * 0.75 - o.sRad, o.wholeCircle * -0.25 + o.sRad, true);
			ctx.closePath();
      
		}
		
		function strokeTempGauge(ctx, x, y, width, height){
			drawTemperatureGauge(ctx, x, y, width, height, 0, 1, 0);
			ctx.stroke();
		}
		
		function fillTempGauge(ctx, x, y, width, height, percent, lengthOffset){
			drawTemperatureGauge(ctx, x, y, width, height,  opts.borderWidth, percent,5);
			ctx.fill();
		}

		function drawLabel(ctx, x, y, text){
			ctx.fillText(text, x , y );
		}
	};
	
	$.fn.tempGauge.defaults = {
		borderColor: "black",
		borderWidth: 1,
		defaultTemp: 26,
		fillColor: "red",
		labelSize: 14,
		labelColor: "black",
    scaleSize: 9,
    scaleColor: "black",
		maxTemp: 40,
		minTemp: -10,
		showLabel: true,
		width: 50,
		showScaleLeft: false,
		showScaleRight: true,
		replaceHtml: false
	};
})(jQuery);